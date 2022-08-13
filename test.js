const addX = (num, x) => {
    return num + x
}

export const LEN = (arr) => {
    return addX(1, 2)
}

export default (arr, num, x) => {

    const clampedX = x > 5 ? 5 : x

    const summedVals = MAP(arr, (item) => {
        return addX(item, num)
    })

    return MAP(summedVals, (item) => {
        return item * clampedX
    })
}