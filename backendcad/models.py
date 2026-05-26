from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    batch_number = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    current_stock = Column(Integer, nullable=False)
    status = Column(String, nullable=False)

