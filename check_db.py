from database import SessionLocal
from models import User, Workstation, WorkOrder, Product, Order, OrderItem, Customer, DowntimeReason

db = SessionLocal()
print("Users:", db.query(User).count())
print("Workstations:", db.query(Workstation).count())
print("Products:", db.query(Product).count())
print("Customers:", db.query(Customer).count())
print("Orders:", db.query(Order).count())
print("OrderItems:", db.query(OrderItem).count())
print("WorkOrders:", db.query(WorkOrder).count())
print("DowntimeReasons:", db.query(DowntimeReason).count())
db.close()
