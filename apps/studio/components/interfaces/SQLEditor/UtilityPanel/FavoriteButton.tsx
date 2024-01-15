import { Button, IconHeart } from 'ui'
import { useQueryClient } from '@tanstack/react-query'
import { contentKeys } from 'data/content/keys'
import { Content, ContentData } from 'data/content/content-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export type FavoriteButtonProps = { id: string }
const FavoriteButton = ({ id }: FavoriteButtonProps) => {
  const client = useQueryClient()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()

  const snippet = snap.snippets[id]
  const isFavorite = snippet !== undefined ? snippet.snippet.content.favorite : false

  async function addFavorite() {
    snap.addFavorite(id)

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) {
          return
        }

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: {
                  ...content.content,
                  favorite: true,
                },
              }
            }

            return content
          }),
        }
      }
    )
  }

  async function removeFavorite() {
    snap.removeFavorite(id)

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) {
          return
        }

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: {
                  ...content.content,
                  favorite: false,
                },
              }
            }

            return content
          }),
        }
      }
    )
  }

  return (
    <>
      {isFavorite ? (
        <Button
          type="text"
          size="tiny"
          onClick={removeFavorite}
          icon={<IconHeart size="tiny" fill="#48bb78" />}
        />
      ) : (
        <Button
          type="text"
          size="tiny"
          onClick={addFavorite}
          icon={<IconHeart size="tiny" fill="gray" />}
        />
      )}
    </>
  )
}

export default FavoriteButton
