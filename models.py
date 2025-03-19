from datetime import datetime
from app import db

class DetectionSession(db.Model):
    """Model for tracking detection sessions"""
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    model_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')
    events = db.relationship('DetectionEvent', backref='session', lazy=True)

    def __repr__(self):
        return f'<DetectionSession {self.id} - {self.model_type}>'

class DetectionEvent(db.Model):
    """Model for tracking individual detection events"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    session_id = db.Column(db.Integer, db.ForeignKey('detection_session.id'), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    model_type = db.Column(db.String(50), nullable=False)
    is_detection = db.Column(db.Boolean, nullable=False)

    def __repr__(self):
        return f'<DetectionEvent {self.id} - Confidence: {self.confidence}>'

class ModelConfiguration(db.Model):
    """Model for storing model configurations"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    model_path = db.Column(db.String(255), nullable=False)
    threshold = db.Column(db.Float, nullable=False, default=0.8)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<ModelConfiguration {self.name}>'

    @staticmethod
    def get_active_models():
        """Get all active model configurations"""
        return ModelConfiguration.query.filter_by(is_active=True).all()

    def to_dict(self):
        """Convert model configuration to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'model_path': self.model_path,
            'threshold': self.threshold,
            'is_active': self.is_active
        }
