import { isFloat, numberFormatter, precisionFormatter } from "components/ui/Charts/Charts.utils"


test("isFloat", () => {
    expect(isFloat(123)).toBe(false)
    expect(isFloat(123.123)).toBe(true)
})
test("numberFormatter", () => {
    expect(numberFormatter(123)).toBe("123")
    expect(numberFormatter(123.123)).toBe("123.12")
})

test("precisionFormatter", () => {
    expect(precisionFormatter(123, 1)).toBe("123.0")
    expect(precisionFormatter(123.12345, 4)).toBe("123.1234")
})