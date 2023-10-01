import { render, screen } from '@testing-library/react'
import Icon from './Icon'

describe('#Icon', () => {
  it('should render Icon correctly', () => {
    render(<Icon data-testid="icon" />)
    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon).toBeInTheDocument()
  })

  it('should change svg size', () => {
    render(<Icon data-testid="icon" size={40} />)
    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon?.getAttribute('width')).toEqual('40')
    expect($elIcon?.getAttribute('height')).toEqual('40')
  })

  it('should change strokeWidth value', () => {
    render(<Icon data-testid="icon" strokeWidth={1} />)
    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon?.getAttribute('stroke-width')).toEqual('1')
  })

  // IMPORTANT: Below test cases assumes defaultSizes['xxxlarge'] is 42 in Icon.tsx, if not change below

  const xxxlarge = '42'

  it('size value must set height and width to its value', () => {
    // Case A (height = defined size):
    // Case A1: size is define explicitly in number
    render(<Icon data-testid="icon-a1" size={10} />)
    const $iconWidthA1A = screen.queryByTestId('icon-a1')?.getAttribute('height')
    const $iconWidthA1B = screen.queryByTestId('icon-a1')?.getAttribute('width')
    expect($iconWidthA1A).toEqual('10')
    expect($iconWidthA1B).toEqual('10')
    // Case A2: size is define explicitly in string
    render(<Icon data-testid="icon-a2" size="xxxlarge" />)
    const $iconWidthA2A = screen.queryByTestId('icon-a2')?.getAttribute('height')
    const $iconWidthA2B = screen.queryByTestId('icon-a2')?.getAttribute('width')
    expect($iconWidthA2A).toEqual(xxxlarge)
    expect($iconWidthA2B).toEqual(xxxlarge)
  })

  it('width value must be set in this order: defined width => size => height => default', () => {
    // Case A (width = defined width):
    // Case A1: width is define explicitly in number
    render(<Icon data-testid="icon-a1" width={10} />)
    const $iconWidthA1 = screen.queryByTestId('icon-a1')?.getAttribute('width')
    expect($iconWidthA1).toEqual('10')
    // Case A2: width is define explicitly in string
    render(<Icon data-testid="icon-a2" width="xxxlarge" />)
    const $iconWidthA2 = screen.queryByTestId('icon-a2')?.getAttribute('width')
    expect($iconWidthA2).toEqual(xxxlarge)

    // Case B (width = defined size when width is not explicitly set):
    // Case B1: size is define explicitly in number but not width
    render(<Icon data-testid="icon-b1" size={10} />)
    const $iconWidthB1 = screen.queryByTestId('icon-b1')?.getAttribute('width')
    expect($iconWidthB1).toEqual('10')
    // Case B2: size is define explicitly in string but not width
    render(<Icon data-testid="icon-b2" size="xxxlarge" />)
    const $iconWidthB2 = screen.queryByTestId('icon-b2')?.getAttribute('width')
    expect($iconWidthB2).toEqual(xxxlarge)
    // Case B3: size & height is define explicitly in number but not width
    // here width should be assigned value of size not height and height should be value of itself
    render(<Icon data-testid="icon-b3" size={20} height={10} />)
    const $iconWidthB3A = screen.queryByTestId('icon-b3')?.getAttribute('width')
    const $iconWidthB3B = screen.queryByTestId('icon-b3')?.getAttribute('height')
    expect($iconWidthB3A).toEqual('20')
    expect($iconWidthB3B).toEqual('10')
    // Case B4: size & height is define explicitly in number and string respectively but not width
    // here width should be assigned value of size not height and height should be value of itself
    render(<Icon data-testid="icon-b4" size={20} height="xxxlarge" />)
    const $iconWidthB4A = screen.queryByTestId('icon-b4')?.getAttribute('width')
    const $iconWidthB4B = screen.queryByTestId('icon-b4')?.getAttribute('height')
    expect($iconWidthB4A).toEqual('20')
    expect($iconWidthB4B).toEqual(xxxlarge)

    // Case C (width = defined height when size & width are not explicitly set):
    // Case C1: height is define explicitly in number but not width & size
    render(<Icon data-testid="icon-c1" height={10} />)
    const $iconWidthC1 = screen.queryByTestId('icon-c1')?.getAttribute('width')
    expect($iconWidthC1).toEqual('10')
    // Case C2: height is define explicitly in string but not width & size
    render(<Icon data-testid="icon-c2" height="xxxlarge" />)
    const $iconWidthC2 = screen.queryByTestId('icon-c2')?.getAttribute('width')
    expect($iconWidthC2).toEqual(xxxlarge)

    // Case D (width = defined default when size & width & height are not explicitly set):
    // For this see the last test
  })

  it('height value must be set in this order: defined height => size => width => default', () => {
    // Case A (height = defined height):
    // Case A1: height is define explicitly in number
    render(<Icon data-testid="icon-a1" height={10} />)
    const $iconHeightA1 = screen.queryByTestId('icon-a1')?.getAttribute('height')
    expect($iconHeightA1).toEqual('10')
    // Case A2: height is define explicitly in string
    render(<Icon data-testid="icon-a2" height="xxxlarge" />)
    const $iconHeightA2 = screen.queryByTestId('icon-a2')?.getAttribute('height')
    expect($iconHeightA2).toEqual(xxxlarge)

    // Case B (height = defined size when height is not explicitly set):
    // Case B1: size is define explicitly in number but not height
    render(<Icon data-testid="icon-b1" size={10} />)
    const $iconHeightB1 = screen.queryByTestId('icon-b1')?.getAttribute('height')
    expect($iconHeightB1).toEqual('10')
    // Case B2: size is define explicitly in string but not height
    render(<Icon data-testid="icon-b2" size="xxxlarge" />)
    const $iconHeightB2 = screen.queryByTestId('icon-b2')?.getAttribute('height')
    expect($iconHeightB2).toEqual(xxxlarge)
    // Case B3: size & width is define explicitly in number but not height
    // here height should be assigned value of size not width and width should be value of itself
    render(<Icon data-testid="icon-b3" size={20} width={10} />)
    const $iconWidthB3A = screen.queryByTestId('icon-b3')?.getAttribute('height')
    const $iconWidthB3B = screen.queryByTestId('icon-b3')?.getAttribute('width')
    expect($iconWidthB3A).toEqual('20')
    expect($iconWidthB3B).toEqual('10')
    // Case B4: size & width is define explicitly in number and string respectively but not height
    // here height should be assigned value of size not width and width should be value of itself
    render(<Icon data-testid="icon-b4" size={20} width="xxxlarge" />)
    const $iconWidthB4A = screen.queryByTestId('icon-b4')?.getAttribute('height')
    const $iconWidthB4B = screen.queryByTestId('icon-b4')?.getAttribute('width')
    expect($iconWidthB4A).toEqual('20')
    expect($iconWidthB4B).toEqual(xxxlarge)

    // Case C (height = defined width when size & height are not explicitly set):
    // Case C1: width is define explicitly in number but not height & size
    render(<Icon data-testid="icon-c1" width={10} />)
    const $iconWidthC1 = screen.queryByTestId('icon-c1')?.getAttribute('height')
    expect($iconWidthC1).toEqual('10')
    // Case C2: width is define explicitly in string but not width & size
    render(<Icon data-testid="icon-c2" width="xxxlarge" />)
    const $iconWidthC2 = screen.queryByTestId('icon-c2')?.getAttribute('height')
    expect($iconWidthC2).toEqual(xxxlarge)

    // Case D (height = defined default when size & width & height are not explicitly set):
    // For this see the last test
  })

  function validateNumber(property: string) {
    return Number(!property.includes(' ') ? property || undefined : undefined)
  }

  it('should have a default height & width', () => {
    render(<Icon data-testid="icon" />)
    const $elIconWidth = screen.queryByTestId('icon')?.getAttribute('width') || ''
    const $elIconHeight = screen.queryByTestId('icon')?.getAttribute('height') || ''
    expect(isNaN(validateNumber($elIconWidth) && validateNumber($elIconHeight))).toBeFalsy()
  })
})
