"""In-memory TTL cache for read-only endpoints.

Used to avoid re-querying immutable historical data (past election results,
bastion/swing analysis, prediction snapshots by version) on every request.
"""
import threading
import time
from typing import Any, Callable

_store: dict[str, tuple[float, Any]] = {}
_lock = threading.Lock()


def get_or_compute(key: str, ttl_seconds: int, compute: Callable[[], Any]) -> Any:
    """Return cached value for key, or run compute() and cache the result."""
    now = time.time()
    with _lock:
        entry = _store.get(key)
        if entry and entry[0] > now:
            return entry[1]

    value = compute()
    with _lock:
        _store[key] = (now + ttl_seconds, value)
    return value


def invalidate_prefix(prefix: str) -> None:
    """Drop all cache entries whose key starts with prefix."""
    with _lock:
        for k in [k for k in _store if k.startswith(prefix)]:
            del _store[k]
