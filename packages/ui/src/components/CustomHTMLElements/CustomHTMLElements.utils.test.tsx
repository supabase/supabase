import { getAnchor, removeAnchor } from './CustomHTMLElements.utils'

describe('CustomHTMLElementsUtils', () => {
  describe('getAnchor', () => {
    describe('when value is an object', () => {
      it('returns slugified version of props.children', () => {
        const value = {
          props: {
            children: 'Full Text Search',
          },
        }

        const result = getAnchor(value)

        expect(result).toStrictEqual('full-text-search')
      })
    })

    describe('when value is an array', () => {
      describe('when custom anchor exists', () => {
        it('returns inner slug', () => {
          const value = ['Proximity: <->', '[#proximity]']

          const result = getAnchor(value)

          expect(result).toStrictEqual('proximity')
        })

        it('trims whitespace', () => {
          const value = ['Proximity: <->', ' [#proximity] ']

          const result = getAnchor(value)

          expect(result).toStrictEqual('proximity')
        })
      })

      it('returns concatenated slug of elements', () => {
        const value = ['Full', 'Text', 'Search']

        const result = getAnchor(value)

        expect(result).toStrictEqual('full-text-search')
      })

      it('trims whitespace', () => {
        const value = [' Full ', ' Text ', ' Search ']

        const result = getAnchor(value)

        expect(result).toStrictEqual('full-text-search')
      })

      it('removes special characters', () => {
        const value = ['function()']

        const result = getAnchor(value)

        expect(result).toStrictEqual('function')
      })
    })

    describe('when value is a string', () => {
      it('returns slugified version of string', () => {
        const value = 'My (Very) Awesome Heading'

        const result = getAnchor(value)

        expect(result).toStrictEqual('my-very-awesome-heading')
      })
    })
  })

  describe('removeAnchor', () => {
    describe('when value is an array', () => {
      it('filters out custom anchor elements', () => {
        const value = ['My (Very) Awesome Heading', '[#my-custom-heading]']

        const result = removeAnchor(value)

        expect(result).toStrictEqual(['My (Very) Awesome Heading'])
      })
    })

    describe('when value is a string', () => {
      it('strips out custom anchor string', () => {
        const value = 'My (Very) Awesome Heading [#my-custom-heading]'

        const result = removeAnchor(value)

        // Original implementation didn't trim the resulting string - not sure if it really matters
        expect(result).toStrictEqual('My (Very) Awesome Heading ')
      })
    })
  })
})
