/**
 * Opens the OS file picker and resolves with the chosen file, or `undefined` if the
 * user dismissed it.
 *
 * The input is created and clicked synchronously so the call stays inside the user
 * gesture that triggered it — Safari blocks a file picker opened from a later tick,
 * which rules out driving a hidden input from an effect.
 */
export const pickFile = ({ accept }: { accept?: string } = {}): Promise<File | undefined> =>
  new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (accept) input.accept = accept

    input.addEventListener('change', () => resolve(input.files?.[0]), { once: true })
    // Fires when the picker is dismissed. Not supported everywhere, so it is a
    // cleanup path rather than the one the resolve depends on.
    input.addEventListener('cancel', () => resolve(undefined), { once: true })

    input.click()
  })
