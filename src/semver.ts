export class Semver {
  protected _major: number
  protected _minor: number
  protected _patch: number

  constructor(semver: [number, number, number]) {
    this._major = semver[0]
    this._minor = semver[1]
    this._patch = semver[2]
  }

  get major() {
    return this._major
  }

  get minor() {
    return this._minor
  }

  get patch() {
    return this._patch
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`
  }

  private static parseToArray(version: string): null | [number, number, number] {
    if (typeof version !== "string") return null

    const [main] = version.split('+')[0].split('-').map(i => i.split('.'))

    const major = parseInt(main[0])

    if (isNaN(major)) return null

    const minor = parseInt(main[1])
    const patch = parseInt(main[2])
    return [major, isNaN(minor) ? 0 : minor, isNaN(patch) ? 0 : patch]
  }

  static fromString(version: string): Semver {
    const parsed = Semver.parseToArray(version)
    if (!parsed) throw new Error(`Semver.fromString: wrong version string value: "${version}"`)
    return new Semver(parsed)
  }

  static isValid(version: string): boolean {
    return typeof version === 'string' && Semver.parseToArray(version) !== null
  }

  isGteThan(version: string) {
    const parsed = Semver.parseToArray(version)
    if (!parsed) return false

    if (this._major > parsed[0]) return true
    if (this._major < parsed[0]) return false

    if (this._minor > parsed[1]) return true
    if (this._minor < parsed[1]) return false

    return this._patch >= parsed[2]
  }

  isLessThan(version: string) {
    const parsed = Semver.parseToArray(version)
    if (!parsed) return false

    if (this._major < parsed[0]) return true
    if (this._major > parsed[0]) return false

    if (this._minor < parsed[1]) return true
    if (this._minor > parsed[1]) return false

    return this._patch < parsed[2]
  }

  isEqual(version: string) {
    const parsed = Semver.parseToArray(version)
    if (!parsed) return false

    return this._major === parsed[0] && this._minor === parsed[1] && this._patch === parsed[2]
  }
}
