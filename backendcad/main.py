from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text # <-- Importado para ejecutar consultas SQL directas
from typing import List, Optional
import json
from datetime import date
from pydantic import BaseModel # <-- Importado para validar los datos del formulario
from database import get_db
from models import ProductBatch
from fastapi.middleware.cors import CORSMiddleware
import uuid
from fastapi import HTTPException

app = FastAPI(title="NewSP API")

# --- CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"], # Permite a Angular conectarse
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SCHEMAS (Validación de datos de Angular) ---
class ProductCreate(BaseModel):
    name: str
    category: str
    batch: str
    sku: str
    stock: int
    unit: str
    mfgDate: Optional[date] = None
    expDate: date
    supplier: str
    refNo: Optional[str] = None

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- RUTAS REST API ---
@app.get("/api/inventory/alerts")
def get_expiry_alerts(db: Session = Depends(get_db)):
    """Obtiene los productos a punto de caducar para el Dashboard"""
    alerts = db.query(ProductBatch).filter(
        ProductBatch.status.in_(['warning', 'critical', 'expired'])
    ).all()
    return alerts

@app.post("/api/inventory/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    try:
        tenant_res = db.execute(text("SELECT id FROM tenants LIMIT 1")).fetchone()
        branch_res = db.execute(text("SELECT id FROM branches LIMIT 1")).fetchone()
        
        if not tenant_res or not branch_res:
            raise Exception("No existen empresas o sucursales registradas.")
            
        tenant_id = tenant_res[0]
        branch_id = branch_res[0]
        
        check_catalog = text("SELECT id FROM product_catalog WHERE sku = :sku")
        result = db.execute(check_catalog, {"sku": product.sku}).fetchone()
        
        if result:
            catalog_id = result[0]
        else:
            insert_catalog = text("""
                INSERT INTO product_catalog (tenant_id, sku, name, category, unit) 
                VALUES (:tenant_id, :sku, :name, :category, :unit) 
                RETURNING id
            """)
            # Aquí inyectamos el valor de Angular y lo pasamos a minúsculas (.lower())
            catalog_result = db.execute(insert_catalog, {
                "tenant_id": tenant_id, "sku": product.sku, 
                "name": product.name, "category": product.category,
                "unit": product.unit.lower() 
            })
            catalog_id = catalog_result.fetchone()[0]

        insert_batch = text("""
            INSERT INTO product_batches 
            (tenant_id, branch_id, catalog_id, batch_number, po_reference, 
             manufacture_date, expiry_date, initial_stock, current_stock, status)
            VALUES 
            (:tenant_id, :branch_id, :catalog_id, :batch, :refNo, 
             :mfgDate, :expDate, :stock, :stock, 'ok')
        """)
        
        db.execute(insert_batch, {
            "tenant_id": tenant_id, "branch_id": branch_id, "catalog_id": catalog_id,
            "batch": product.batch, "refNo": product.refNo,
            "mfgDate": product.mfgDate, "expDate": product.expDate, "stock": product.stock
        })
        
        db.commit() 
        return {"message": "Producto guardado con éxito en la BD real"}

    except Exception as e:
        db.rollback() 
        print(f"\n!!! ERROR DE POSTGRESQL !!! -> {str(e)}\n")
        raise HTTPException(status_code=400, detail=str(e))
        
@app.get("/api/inventory/products")
def get_all_products(db: Session = Depends(get_db)):
    # Hacemos un JOIN entre los lotes y el catálogo para tener toda la info
    query = text("""
        SELECT 
            c.name, c.sku, c.category, 
            b.expiry_date as expiry, 
            b.current_stock as stock, 
            b.status,
            b.batch_number as batch
        FROM product_batches b
        JOIN product_catalog c ON b.catalog_id = c.id
    """)
    result = db.execute(query).fetchall()
    
    # Lo convertimos a una lista de diccionarios para enviarlo como JSON
    products = []
    for row in result:
        products.append({
            "name": row[0],
            "sku": row[1],
            "category": row[2],
            "expiry": str(row[3]),
            "stock": row[4],
            "status": row[5].upper(), # Lo ponemos en mayúsculas para el diseño
            "batch": row[6]
        })
    return products

# --- ENDPOINT WEBSOCKET ---
@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- TAREAS EN SEGUNDO PLANO (Notificaciones) ---
def send_whatsapp_alert(phone_number: str, product_name: str, days_left: int):
    print(f"[Simulando API WhatsApp] Enviando a {phone_number}: {product_name} caduca en {days_left} días.")

@app.post("/api/inventory/trigger-alerts")
async def trigger_alerts(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    critical_batches = db.query(ProductBatch).filter(ProductBatch.status == 'critical').all()
    
    for batch in critical_batches:
        phone = "+5216681000001" 
        background_tasks.add_task(send_whatsapp_alert, phone, batch.batch_number, 7)
    
    await manager.broadcast(json.dumps({"event": "alerts_triggered", "count": len(critical_batches)}))
    
    return {"message": "Alertas procesadas en segundo plano"}