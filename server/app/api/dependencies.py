"""
API dependencies for authentication and authorization
"""
from fastapi import Header, HTTPException, status
from typing import Optional
from app.config import settings


def verify_admin_key(
    x_admin_key: Optional[str] = Header(None, description="Admin API key for write operations")
) -> str:
    """
    Verify that the provided admin API key is valid.

    This dependency protects admin endpoints (POST, PUT, DELETE operations).
    Raises 403 Forbidden if the key is missing or invalid.

    Args:
        x_admin_key: The admin API key from request headers

    Returns:
        The validated API key

    Raises:
        HTTPException: 403 if key is missing or invalid

    Usage:
        @router.post("/")
        def create_item(
            item: ItemCreate,
            admin_key: str = Depends(verify_admin_key)
        ):
            # Only reachable with valid admin key
            ...
    """
    if not x_admin_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing admin API key. Include 'X-Admin-Key' header for write operations.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return x_admin_key


def get_optional_admin_key(
    x_admin_key: Optional[str] = Header(None, description="Optional admin API key")
) -> Optional[str]:
    """
    Get the admin API key if provided, but don't require it.

    Useful for endpoints that have different behavior for admins vs public users.

    Args:
        x_admin_key: The admin API key from request headers (optional)

    Returns:
        The API key if valid, None otherwise

    Usage:
        @router.get("/")
        def get_items(
            admin_key: Optional[str] = Depends(get_optional_admin_key)
        ):
            if admin_key:
                # Admin access - return sensitive data
                ...
            else:
                # Public access - return limited data
                ...
    """
    if not x_admin_key:
        return None

    if x_admin_key == settings.ADMIN_API_KEY:
        return x_admin_key

    return None
