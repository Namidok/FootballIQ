import time
import threading
from collections import deque


class TokenBucketRateLimiter:
    """Blocks the caller until a call is safe to make under a per-minute cap.

    Simple sliding-window limiter — good enough for single-process ingestion jobs.
    """

    def __init__(self, max_calls_per_minute: int):
        self.max_calls = max_calls_per_minute
        self.window_seconds = 60
        self._calls = deque()
        self._lock = threading.Lock()

    def wait(self):
        with self._lock:
            now = time.monotonic()
            while self._calls and now - self._calls[0] > self.window_seconds:
                self._calls.popleft()

            if len(self._calls) >= self.max_calls:
                sleep_for = self.window_seconds - (now - self._calls[0]) + 0.1
                time.sleep(max(sleep_for, 0))
                now = time.monotonic()
                while self._calls and now - self._calls[0] > self.window_seconds:
                    self._calls.popleft()

            self._calls.append(time.monotonic())
