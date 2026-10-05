/**
 * Created and clicked synchronously to stay inside the user gesture, which Safari
 * requires — so no hidden input driven from an effect.
 */
export const pickFile = ({ accept }: { accept?: string } = {}): Promise<File | undefined> =>
  new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (accept) input.accept = accept

    input.addEventListener('change', () => resolve(input.files?.[0]), { once: true })
    // Not supported everywhere, so this is a cleanup path rather than the one resolve needs.
    input.addEventListener('cancel', () => resolve(undefined), { once: true })

    input.click()
  })
