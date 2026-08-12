def to_int(value: float) -> int:
    value = int(value) & 0xFFFF_FFFF
    return value if value < 0x8000_0000 else value - 0x1_0000_0000


def to_short(value: float) -> int:
    value = int(value) & 0xFFFF
    return value if value < 0x8000 else value - 0x1_0000


def to_byte(value: float) -> int:
    value = int(value) & 0xFF
    return value if value < 0x80 else value - 0x100


def int_div(dividend: int, divisor: int) -> int:
    if divisor == 0:
        raise ZeroDivisionError("/ by zero")
    quotient = abs(dividend) // abs(divisor)
    return -quotient if (dividend < 0) != (divisor < 0) else quotient


def int_remainder(dividend: int, divisor: int) -> int:
    return dividend - int_div(dividend, divisor) * divisor


def unsigned_right_shift(value: int, distance: int) -> int:
    return (value & 0xFFFF_FFFF) >> (distance & 0x1F)

