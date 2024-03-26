// Porting from
// https://github.com/Borvik/vscode-postgres/blob/master/src/common/backwordIterator.ts

const _NL = '\n'.charCodeAt(0)
const _TAB = '\t'.charCodeAt(0)
const _WSB = ' '.charCodeAt(0)
const _LBracket = '['.charCodeAt(0)
const _RBracket = ']'.charCodeAt(0)
const _LCurly = '{'.charCodeAt(0)
const _RCurly = '}'.charCodeAt(0)
const _LParent = '('.charCodeAt(0)
const _RParent = ')'.charCodeAt(0)
const _Comma = ','.charCodeAt(0)
const _Period = '.'.charCodeAt(0)
const _Quote = "'".charCodeAt(0)
const _DQuote = '"'.charCodeAt(0)
const _USC = '_'.charCodeAt(0)
// _a will give undefined... so rename to _aCode
const _aCode = 'a'.charCodeAt(0)
const _z = 'z'.charCodeAt(0)
const _A = 'A'.charCodeAt(0)
const _Z = 'Z'.charCodeAt(0)
const _0 = '0'.charCodeAt(0)
const _9 = '9'.charCodeAt(0)

const BOF = 0

class BackwardIterator {
  _line
  _text
  _lines

  model
  offset
  lineNumber

  constructor(model: any, offset: number, lineNumber: number) {
    this.model = model
    this.offset = offset
    this.lineNumber = lineNumber

    this._text = model.getValue()
    this._lines = this._text.split(/\r?\n/g)
    this._line = this._lines[lineNumber]
  }

  hasNext() {
    return this.lineNumber >= 0 || this.offset >= 0
  }

  isFowardDQuote() {
    if (!this.hasForward()) return false
    return this.peekForward() === _DQuote
  }

  isNextDQuote() {
    if (!this.hasNext()) return false
    return this.peekNext() === _DQuote
  }

  isNextPeriod() {
    if (!this.hasNext()) return false
    return this.peekNext() === _Period
  }

  peekNext() {
    if (this.offset < 0) {
      if (this.lineNumber > 0) {
        return _NL
      }
      return BOF
    }
    return this._line.charCodeAt(this.offset)
  }

  hasForward() {
    return this.lineNumber < this._lines.length || this.offset < this._line.length
  }

  peekForward() {
    if (this.offset === this._line.length) {
      if (this.lineNumber === this._lines.length) return BOF
      return _NL
    }
    return this._line.charCodeAt(this.offset + 1)
  }

  next() {
    if (this.offset < 0) {
      if (this.lineNumber > 0) {
        this.lineNumber--
        this._line = this._lines[this.lineNumber]
        this.offset = this._line.length - 1
        return _NL
      }
      this.lineNumber = -1
      return BOF
    }
    let ch = this._line.charCodeAt(this.offset)
    this.offset--
    return ch
  }

  readArguments() {
    let parentNesting = 0
    let bracketNesting = 0
    let curlyNesting = 0
    let paramCount = 0
    while (this.hasNext()) {
      let ch = this.next()
      switch (ch) {
        case _LParent:
          parentNesting--
          if (parentNesting < 0) {
            return paramCount
          }
          break
        case _RParent:
          parentNesting++
          break
        case _LCurly:
          curlyNesting--
          break
        case _RCurly:
          curlyNesting++
          break
        case _LBracket:
          bracketNesting--
          break
        case _RBracket:
          bracketNesting++
          break
        case _DQuote:
        case _Quote:
          while (this.hasNext() && ch !== this.next()) {
            // find the closing quote or double quote
          }
          break
        case _Comma:
          if (!parentNesting && !bracketNesting && !curlyNesting) {
            paramCount++
          }
          break
      }
    }
    return -1
  }

  readIdent() {
    let identStarted = false
    let isQuotedIdentifier = false
    let ident = ''

    while (this.hasNext()) {
      // Peek first and check if is part of identifier
      let ch = this.peekNext()
      if (identStarted && !isQuotedIdentifier && !this._isIdentPart(ch)) break

      ch = this.next()

      if (!identStarted && isQuotedIdentifier && ch === _DQuote) {
        identStarted = true
        continue
      }
      if (!identStarted && (ch === _WSB || ch === _TAB || ch == _NL)) continue

      if (!identStarted && (ch === _DQuote || this._isIdentPart(ch))) {
        identStarted = true
        isQuotedIdentifier = ch === _DQuote
        ident = String.fromCharCode(ch) + ident
      } else if (identStarted) {
        if (isQuotedIdentifier) {
          if (ch === BOF) break
          ident = String.fromCharCode(ch) + ident
          if (ch === _DQuote) break
        } else {
          ident = String.fromCharCode(ch) + ident
        }
      }
    }
    return ident
  }

  readIdents(maxlvl: number) {
    let idents = []
    while (maxlvl > 0) {
      maxlvl--
      let ident = this.readIdent()
      if (!ident) {
        break
      }

      idents.push(ident)

      if (!this.isNextPeriod()) {
        break
      }
    }
    return idents.reverse()
  }

  _isIdentPart(ch: number) {
    return (
      ch === _USC || // _
      (ch >= _aCode && ch <= _z) || // a-z
      (ch >= _A && ch <= _Z) || // A-Z
      (ch >= _0 && ch <= _9)
    ) // 0-9
  }
}

export default BackwardIterator
