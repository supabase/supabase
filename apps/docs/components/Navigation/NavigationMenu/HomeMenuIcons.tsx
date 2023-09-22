import { products } from 'shared-data'

type HomeMenuIcon = {
  width?: number
  height?: number
}
export function IconMenuHome({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.889 13.83V8h4.222v5.83M3 5.494v8.338h10V5.54L7.994 2.02 3 5.493Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuGraphQL({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12,5.37L11.56,5.31L6,14.9C6.24,15.11 6.4,15.38 6.47,15.68H17.53C17.6,15.38 17.76,15.11 18,14.9L12.44,5.31L12,5.37M6.6,16.53L10.88,19.06C11.17,18.79 11.57,18.63 12,18.63C12.43,18.63 12.83,18.79 13.12,19.06L17.4,16.53H6.6M12,22A1.68,1.68 0 0,1 10.32,20.32L10.41,19.76L6.11,17.21C5.8,17.57 5.35,17.79 4.84,17.79A1.68,1.68 0 0,1 3.16,16.11C3.16,15.32 3.69,14.66 4.42,14.47V9.36C3.59,9.25 2.95,8.54 2.95,7.68A1.68,1.68 0 0,1 4.63,6C5.18,6 5.66,6.26 5.97,6.66L10.38,4.13L10.32,3.68C10.32,2.75 11.07,2 12,2C12.93,2 13.68,2.75 13.68,3.68L13.62,4.13L18.03,6.66C18.34,6.26 18.82,6 19.37,6A1.68,1.68 0 0,1 21.05,7.68C21.05,8.54 20.41,9.25 19.58,9.36V14.47C20.31,14.66 20.84,15.32 20.84,16.11A1.68,1.68 0 0,1 19.16,17.79C18.65,17.79 18.2,17.57 17.89,17.21L13.59,19.76L13.68,20.32A1.68,1.68 0 0,1 12,22M10.8,4.86L6.3,7.44L6.32,7.68C6.32,8.39 5.88,9 5.26,9.25L5.29,14.5L10.8,4.86M13.2,4.86L18.71,14.5L18.74,9.25C18.12,9 17.68,8.39 17.68,7.68L17.7,7.44L13.2,4.86Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuApi({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.7118 15.4651C10.8778 15.8159 9.96154 16.0098 9 16.0098C8.03846 16.0098 7.1222 15.8159 6.28818 15.4651M2.42438 11.4156C2.14983 10.6654 2 9.85506 2 9.00977C2 8.16447 2.14983 7.35417 2.42438 6.60397M6.28818 2.55442C7.1222 2.20364 8.03846 2.00977 9 2.00977C9.96154 2.00977 10.8778 2.20364 11.7118 2.55442M15.4553 6.29795C15.8061 7.13197 16 8.04823 16 9.00977C16 9.97131 15.8061 10.8876 15.4553 11.7216M10.7427 10.861L13.0078 13.1261M4.99476 5.11305L7.25997 7.37826M7.14874 10.7525L4.88369 13.0176M12.8967 5.00452L10.6315 7.26974M6.08663 9.00977C6.08663 7.40076 7.39099 6.0964 9 6.0964C10.609 6.0964 11.9134 7.40076 11.9134 9.00977C11.9134 10.6188 10.609 11.9231 9 11.9231C7.39099 11.9231 6.08663 10.6188 6.08663 9.00977ZM3.10575 3.11551C3.58524 2.63602 4.36265 2.63602 4.84214 3.11551C5.32164 3.59501 5.32164 4.37242 4.84214 4.85191C4.36265 5.3314 3.58524 5.3314 3.10575 4.85191C2.62625 4.37242 2.62625 3.59501 3.10575 3.11551ZM13.1579 13.1676C13.6373 12.6881 14.4148 12.6881 14.8943 13.1676C15.3737 13.6471 15.3737 14.4245 14.8943 14.904C14.4148 15.3835 13.6373 15.3835 13.1579 14.904C12.6784 14.4245 12.6784 13.6471 13.1579 13.1676ZM14.8948 3.11549C15.3743 3.59498 15.3743 4.37239 14.8948 4.85189C14.4153 5.33138 13.6379 5.33138 13.1584 4.85189C12.6789 4.37239 12.6789 3.59498 13.1584 3.11549C13.6379 2.636 14.4153 2.636 14.8948 3.11549ZM4.84214 13.1676C5.32164 13.6471 5.32164 14.4245 4.84214 14.904C4.36265 15.3835 3.58524 15.3835 3.10575 14.904C2.62625 14.4245 2.62625 13.6471 3.10575 13.1676C3.58524 12.6881 4.36265 12.6881 4.84214 13.1676Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuAuth({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.authentication.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuCli({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m5.266 5.552 2.4 2.401-2.4 2.402M8 10.149h3M2 2h12v12H2V2Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuCsharp({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m2.242 11.3.004-.003a1.191 1.191 0 0 1-.134-.57V5.27c0-.442.185-.784.57-1.005.444-.259 1.393-.804 2.33-1.343 1.019-.587 2.024-1.165 2.35-1.356.42-.247.826-.254 1.25-.01l2.37 1.364 2.336 1.345c.189.109.33.247.425.414.098.167.145.366.145.587V10.73c-.001.216-.048.407-.138.573a1.089 1.089 0 0 1-.432.428l-1.786 1.028c-.973.56-1.947 1.12-2.92 1.682-.388.228-.767.236-1.155.042a1.65 1.65 0 0 1-.103-.056c-.382-.227-1.702-.986-2.881-1.664-.747-.429-1.437-.826-1.799-1.036a1.137 1.137 0 0 1-.432-.428Zm7.452-2.351a1.95 1.95 0 0 1-1.698.994 1.94 1.94 0 0 1-1.69-.983A1.946 1.946 0 0 1 9.68 7.02l1.7-.98a3.91 3.91 0 1 0-3.385 5.866 3.913 3.913 0 0 0 3.4-1.974l-1.701-.983Zm2.151-1.88h-.388v.316h-.312v.388h.312v.468h-.312v.388h.312v.316h.388v-.316h.472v.316h.388v-.316h.316v-.388h-.316v-.468h.316v-.388h-.316V7.07h-.388v.316h-.472V7.07Zm0 1.172v-.468h.472v.468h-.472Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuDatabase({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.database.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuRestApis({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.923 9.927A5.833 5.833 0 0 1 1.14 7m2.877-5.046A5.833 5.833 0 0 1 7 1.14m5.13 3.025c.465.84.73 1.807.73 2.835m-2.883 5.049A5.832 5.832 0 0 1 7 12.859m6.172-10.027a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4.81 11.148a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8.362 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4.81 2.832a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuEdgeFunctions({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.functions.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuExtensions({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.418 2.098v5m-2.5-2.5h5m-11.836-2.5h5v5h-5v-5Zm5.185 9.145a2.685 2.685 0 1 1-5.37 0 2.685 2.685 0 0 1 5.37 0Zm1.651-2.396h5v5h-5v-5Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuFlutter({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m11.857 2-3.718.004L2.143 8l1.85 1.852 1.626-1.617L11.857 2ZM8.245 7.531c-.052-.002-.107-.005-.14.04l-3.198 3.197 1.836 1.825-.002.002 1.315 1.316a.549.549 0 0 1 .026.025c.035.036.074.074.13.062.607-.002 1.214-.002 1.821-.001l1.822-.001-3.232-3.235 3.23-3.23H8.31a.39.39 0 0 1-.064 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuGettingStarted({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m13.429 8-4.681 2.702-4.681 2.703V2.594l4.68 2.703 4.682 2.702Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuIntegrations({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.83 1.453v5.619m-2.809-2.81h5.62M1.338 1.454h5.62v5.619h-5.62V1.453Zm5.827 10.278a3.017 3.017 0 1 1-6.035 0 3.017 3.017 0 0 1 6.035 0ZM9.02 9.038h5.62v5.619H9.02V9.038Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuJavascript({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2h12v12H2V2Zm9.173 10.06c-.556 0-.87-.29-1.112-.685l-.916.533c.33.654 1.007 1.153 2.054 1.153 1.071 0 1.869-.556 1.869-1.572 0-.941-.541-1.36-1.5-1.771l-.281-.12c-.484-.21-.693-.347-.693-.686 0-.273.209-.483.54-.483.323 0 .532.137.725.483l.878-.563c-.371-.654-.887-.903-1.604-.903-1.007 0-1.651.644-1.651 1.49 0 .917.54 1.352 1.354 1.698l.282.121c.514.225.821.362.821.749 0 .322-.299.556-.766.556Zm-4.37-.007c-.387 0-.548-.266-.726-.58l-.917.556c.265.562.788 1.03 1.691 1.03 1 0 1.684-.532 1.684-1.7V7.51H7.407v3.834c0 .564-.233.709-.604.709Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuPlatform({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.556 5.554 13.77 7.14l-5.772 4.04-5.737-4.04 2.199-1.587M3.313 7.888.813 9.72l6.996 4.926 7.039-4.926-2.33-1.682M3.285 4.74 8 8.061l4.742-3.32L8 1.338 3.286 4.74Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuPython({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.424 1.627A9.05 9.05 0 0 1 7.923 1.5a9.885 9.885 0 0 1 1.633.127c.851.14 1.568.771 1.568 1.612v2.953a1.57 1.57 0 0 1-1.568 1.576H6.424c-1.063 0-1.959.903-1.959 1.927v1.416H3.387c-.911 0-1.443-.654-1.666-1.572-.3-1.233-.288-1.97 0-3.152.25-1.03 1.047-1.572 1.959-1.572h4.312V4.42H4.856V3.239c0-.895.241-1.38 1.568-1.612Zm.391 1.417a.592.592 0 0 0-.588-.593.59.59 0 0 0 0 1.182.59.59 0 0 0 .588-.59Zm4.7 3.148V4.815h1.177c.912 0 1.342.675 1.568 1.572.313 1.246.327 2.18 0 3.152-.317.944-.657 1.572-1.568 1.572h-4.7v.394h3.132v1.182c0 .896-.778 1.35-1.568 1.577-1.187.34-2.14.288-3.132 0-.829-.242-1.568-.736-1.568-1.576V9.733c0-.85.71-1.576 1.568-1.576h3.132c1.044 0 1.96-.898 1.96-1.966Zm-1.173 6.69a.589.589 0 1 0-1.177 0c0 .328.265.594.589.594a.59.59 0 0 0 .588-.593Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuRealtime({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.realtime.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuResources({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 12V5l-.009-3H3v10.5m0 0A1.5 1.5 0 0 0 4.5 14H13v-1.65L12.991 11H4.5A1.5 1.5 0 0 0 3 12.5ZM5.005 2v4l1.5-1.695L8.005 6V2h-3Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuSelfHosting({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.041 14.37v-2.285a3.245 3.245 0 0 0-3.244-3.244M7.317 10H3v4h3.552v-1.916a3.257 3.257 0 0 1 3.245-3.244m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6H3V2h10v4h-1.43M3.502 6v4"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuStorage({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.storage.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

export function IconMenuAI({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={products.vector.icon[16]}
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconMenuSwift({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.364 4.774c.004.128.005.256.006.384l.001.439v5.245c-.002.128-.003.256-.007.384-.007.28-.024.561-.073.837-.05.28-.133.541-.263.796a2.673 2.673 0 0 1-1.17 1.17c-.254.13-.514.211-.795.262-.276.05-.558.066-.837.073-.128.004-.256.005-.384.006l-.408.001H5.565l-.407-.001c-.128 0-.256-.002-.384-.006a5.571 5.571 0 0 1-.837-.073c-.28-.05-.541-.133-.796-.262a2.674 2.674 0 0 1-1.17-1.17 2.824 2.824 0 0 1-.262-.796 5.582 5.582 0 0 1-.073-.837 18.375 18.375 0 0 1-.006-.384l-.001-.404V5.158c.002-.128.003-.256.007-.384.007-.28.024-.561.073-.837.05-.28.133-.541.262-.796a2.673 2.673 0 0 1 1.362-1.258c.194-.08.393-.136.604-.174.207-.037.417-.056.627-.066.07-.003.14-.006.21-.007.128-.004.256-.005.384-.006l.457-.001H10.842l.384.006c.28.008.561.024.837.074.28.05.541.133.796.262a2.671 2.671 0 0 1 1.17 1.17c.13.255.212.515.262.796.05.276.066.558.073.837Zm-2.64 4.72h.002c1.094 1.347.797 2.791.656 2.519-.572-1.114-1.638-.83-2.178-.55-.044.028-.09.053-.136.078l-.008.004a.306.306 0 0 0-.01.006l.002-.002c-1.124.597-2.632.642-4.149-.01A6.673 6.673 0 0 1 2.908 8.97c.345.255.718.48 1.114.665 1.603.75 3.213.697 4.352 0C6.753 8.386 5.4 6.762 4.361 5.446a5.644 5.644 0 0 1-.534-.736C5.07 5.85 7.033 7.277 7.737 7.672c-1.494-1.58-2.812-3.525-2.75-3.462 2.355 2.372 4.527 3.714 4.527 3.714.082.045.143.081.192.113.044-.114.084-.232.118-.355.376-1.374-.047-2.946-1.004-4.243 2.184 1.311 3.474 3.802 2.946 5.91a75.282 75.282 0 0 0-.041.145Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuKotlin({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={width}
      height={height}
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 14H2V2H14L8 8L14 14Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconMenuStatus({ width = 16, height = 16 }: HomeMenuIcon) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.9895 1.13281C4.64498 1.13281 1.12305 4.65474 1.12305 8.99927C1.12305 13.3438 4.64498 16.8657 8.9895 16.8657C13.334 16.8657 16.856 13.3438 16.856 8.99927C16.856 7.13428 16.207 5.42087 15.1225 4.07258L8.35267 10.8424L6.39571 8.88546M9.06632 4.19659C6.42145 4.19659 4.27737 6.34068 4.27737 8.98555C4.27737 11.6304 6.42145 13.7745 9.06632 13.7745C11.7112 13.7745 13.8553 11.6304 13.8553 8.98555C13.8553 7.99916 13.5571 7.08243 13.0459 6.32059"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}
