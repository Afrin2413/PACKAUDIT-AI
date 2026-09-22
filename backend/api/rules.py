from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from models.schemas import RuleDefinition, RuleUpdatePayload
from utils.security import get_current_user
from rules.rule_engine import rule_engine_instance

router = APIRouter(prefix="/rules", tags=["Rules Management"])

@router.get("", response_model=Dict[str, Any])
def get_all_rules(current_user: Dict[str, Any] = Depends(get_current_user)):
    rules = rule_engine_instance.get_rules()
    return {
        "version": rule_engine_instance.config.get("version", "1.0.0"),
        "title": rule_engine_instance.config.get("title", "Legal Metrology (Packaged Commodities) Rules, 2011"),
        "authority": rule_engine_instance.config.get("authority", "Ministry of Consumer Affairs, Government of India"),
        "last_updated": rule_engine_instance.config.get("last_updated", "2026-01-15T00:00:00Z"),
        "disclaimer": rule_engine_instance.config.get("disclaimer"),
        "rules": rules
    }

@router.put("/{rule_id}", response_model=Dict[str, Any])
def update_rule_config(
    rule_id: str,
    payload: RuleUpdatePayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    updates = payload.model_dump(exclude_unset=True)
    updated_rule = rule_engine_instance.update_rule(rule_id, updates)
    if not updated_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rule {rule_id} not found.")
    
    return {
        "status": "success",
        "message": f"Rule {rule_id} updated successfully.",
        "rule": updated_rule
    }
