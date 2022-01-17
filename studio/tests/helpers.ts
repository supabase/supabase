import { screen, getByText, fireEvent } from '@testing-library/react'
interface SelectorOptions {
    container?: HTMLElement
}

/**
 * Returns the toggle button given a text matcher
 * 
 * Defaults to screen if container option is not provided
 */
export const getToggleByText = (text: string | RegExp, options: SelectorOptions = {}): HTMLElement | null => {
    const container = options?.container
    let textNode;
    if (container) {
        textNode = getByText(container as HTMLElement, text)
    }
    else {
        textNode = screen.getByText(text)
    }
    if (textNode && textNode.parentElement) {
        return textNode.parentElement.querySelector("button[class*='toggle']")
    } else {
        return textNode
    }

}

export const clickDropdown = (elem: HTMLElement) => {
    fireEvent.pointerDown(
        elem,
        new window.PointerEvent('pointerdown', {
            ctrlKey: false,
            button: 0,
        })
    );
}