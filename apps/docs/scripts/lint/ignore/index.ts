type RuleId = string

type Range = [number, number]

class Ranges {
  readonly ranges: Range[]

  static overlaps(a: Range, b: Range) {
    if (a[0] > b[0]) return Ranges.overlaps(b, a)
    return a[1] >= b[0]
  }

  static mergeRanges(a: Range, b: Range): Range {
    return [Math.min(a[0], b[0]), Math.max(a[0], b[0])]
  }

  constructor() {
    this.ranges = []
  }

  addRange(start: number, end: number) {
    let newRange = [start, end] as Range

    // linear but short enough that this probably shouldn't matter
    const firstEqualOrLargerIndex = this.ranges.findIndex((range) => range[0] >= start)
    if (!firstEqualOrLargerIndex) {
      // this range is larger than any existing range
      // add it to the end
      this.ranges.push(newRange)
    } else if (Ranges.overlaps(this.ranges[firstEqualOrLargerIndex], newRange)) {
      newRange = Ranges.mergeRanges(this.ranges[firstEqualOrLargerIndex], newRange)
      this.ranges.splice(firstEqualOrLargerIndex, 1, newRange)
    } else {
      this.ranges.splice(firstEqualOrLargerIndex, 0, newRange)
    }

    return this
  }
}

interface CommonIgnore {
  ruleId: RuleId
}

interface RangeIgnore extends CommonIgnore {
  scope: 'range'
  ranges: Ranges
}

interface GlobalIgnore extends CommonIgnore {
  scope: 'file'
}

type IgnoreMeta = GlobalIgnore | RangeIgnore

export class FileIgnores {
  private ignores: Map<RuleId, IgnoreMeta>

  static isGlobal(ignoreMeta: IgnoreMeta | undefined): ignoreMeta is GlobalIgnore {
    return ignoreMeta && ignoreMeta.scope === 'file'
  }

  constructor() {
    this.ignores = new Map()
  }

  addGlobalIgnore(ruleId: RuleId) {
    this.ignores.set(ruleId, { scope: 'file', ruleId })
  }

  addRangeIgnore(ruleId: RuleId, start: number, end: number) {
    const currIgnore = this.ignores.get(ruleId)

    if (FileIgnores.isGlobal(currIgnore)) return

    if (!currIgnore) {
      this.ignores.set(ruleId, {
        scope: 'range',
        ruleId,
        ranges: new Ranges().addRange(start, end),
      })
      return
    }

    currIgnore.ranges.addRange(start, end)
  }
}
