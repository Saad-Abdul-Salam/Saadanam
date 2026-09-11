import { useEffect } from 'react'

const BASE_TITLE = 'Saadanam'

/**
 * Sets a per-page document title: "<Page> · Saadanam".
 * Fixes every page showing the same generic browser tab title.
 */
export default function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE
        return () => { document.title = BASE_TITLE }
    }, [title])
}
