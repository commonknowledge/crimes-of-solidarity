import { useRef, useEffect } from 'react';
import qs from 'query-string';
import { useRouter } from 'next/dist/client/router';
import { useDebounce } from 'use-debounce'

type URLStateOptions<H> = {
  serialiseStateToObject: (key: string, state: H) => any
}

export function useURLStateFactory () {
  const router = useRouter()
  const params = useRef({})

  return function <H = [any, any]>(
    key: string,
    stateHook: (initialValue: string | string[] | null) => H,
    options?: Partial<URLStateOptions<H>>
  ) {
    const {
      serialiseStateToObject,
    } = Object.assign(
      {
        serialiseStateToObject: (key, [state]: any) => ({ [key]: state })
      } as URLStateOptions<H>,
      options
    )

    // Look for initial value from `key`
    const initialValue = qs.parseUrl(router.asPath).query[key]

    // Initialise state
    const state = stateHook(initialValue)

    const [updateURL] = useDebounce((params) => {
      router.push({ query: params }, undefined, { shallow: true })
    }, 500)

    // Update URL object when state changes
    useEffect(() => {
      params.current = ({ ...params.current, ...serialiseStateToObject(key, state) })
      updateURL(params.current)
    }, [state[0] /* state value */])

    // Pass through state
    return state
  }
}