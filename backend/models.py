from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()


class ScanReport(db.Model):
    __tablename__ = "scan_reports"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    user = db.Column(db.String(100))
    data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


