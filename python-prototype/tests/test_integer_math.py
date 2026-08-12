import unittest

from gradius_neo.integer_math import int_div, int_remainder, to_byte, to_int, to_short, unsigned_right_shift


class IntegerMathTest(unittest.TestCase):
    def test_signed_width_conversions(self) -> None:
        self.assertEqual(to_byte(255), -1)
        self.assertEqual(to_short(65_535), -1)
        self.assertEqual(to_int(0xFFFF_FFFF), -1)

    def test_java_division_truncates_toward_zero(self) -> None:
        self.assertEqual(int_div(-7, 3), -2)
        self.assertEqual(int_remainder(-7, 3), -1)

    def test_unsigned_shift(self) -> None:
        self.assertEqual(unsigned_right_shift(-1, 1), 0x7FFF_FFFF)


if __name__ == "__main__":
    unittest.main()

