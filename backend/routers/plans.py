from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Plan, User
from schemas import PlanResponse, PlanSubscribeRequest, UserResponse
from auth import get_current_user

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)) -> list[Plan]:
    return db.query(Plan).order_by(Plan.id.asc()).all()


@router.post("/subscribe", response_model=UserResponse)
def subscribe_plan(
    payload: PlanSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    # TODO(real-impl): integrate payment gateway before updating plan
    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )
    current_user.plan_id = plan.id
    db.commit()
    db.refresh(current_user)
    return current_user
