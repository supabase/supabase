import {
  ArrowLeftRight,
  BotIcon,
  Building2Icon,
  Code2Icon,
  PointerIcon,
  PuzzleIcon,
  TrendingUpIcon,
} from 'lucide-react'

export type SolutionTypes = Solutions[keyof Solutions]

export enum Solutions {
  aiBuilders = 'ai-builders',
  noCode = 'no-code',
  beginners = 'beginners',
  developers = 'developers',
  postgresDevs = 'postgres-developers',
  neon = 'neon',
  startups = 'startups',
  enterprise = 'enterprise',
}

export const skillBasedSolutions = {
  label: 'Solutions',
  solutions: [
    {
      id: Solutions.aiBuilders,
      text: 'AI Builders',
      description: '',
      url: '/solutions/ai-builders',
      icon: BotIcon,
    },
    {
      id: Solutions.noCode,
      text: 'No Code',
      description: '',
      url: '/solutions/no-code',
      icon: PointerIcon,
    },
    {
      id: Solutions.beginners,
      text: 'Beginners',
      description: '',
      url: '/solutions/beginners',
      icon: PuzzleIcon,
    },
    {
      id: Solutions.developers,
      text: 'Developers',
      description: '',
      url: '/solutions/developers',
      icon: Code2Icon,
    },
    {
      id: Solutions.postgresDevs,
      text: 'Postgres Devs',
      description: '',
      url: '/solutions/postgres-developers',
      icon: (props: any) => (
        <svg
          width="26"
          height="25"
          viewBox="0 0 26 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          {...props}
        >
          <path
            d="M13.553 14.5434C14.5936 16.6636 16.7499 18.0071 19.1117 18.0073H25.1729C25.5138 18.0076 25.7898 18.2842 25.7898 18.6252C25.7896 18.9659 25.5137 19.2427 25.1729 19.243H22.3584C22.3941 19.3211 22.415 19.4075 22.4151 19.499C22.4151 22.1237 20.0255 23.8922 17.3294 23.8923C14.9326 23.8923 12.924 22.2346 12.3854 20.0036L12.3382 19.7854L12.3267 19.6605C12.3294 19.3734 12.5331 19.1177 12.826 19.0605C13.1604 18.9955 13.4843 19.2139 13.5498 19.5483C13.8955 21.3196 15.4573 22.6565 17.3294 22.6565C19.5686 22.6564 21.1804 21.2361 21.1804 19.499C21.1804 19.4074 21.2012 19.3212 21.237 19.243H19.1117C16.2786 19.2429 13.6923 17.6302 12.4441 15.0868L13.553 14.5434Z"
            fill="currentColor"
          />
          <path
            d="M11.9396 0.59251H13.0442C18.2192 0.592582 22.4148 4.78736 22.4151 9.96235V15.3952C22.4151 15.7363 22.1383 16.013 21.7972 16.0131C21.4562 16.0129 21.1804 15.7362 21.1804 15.3952V9.96235C21.1801 5.46961 17.537 1.82728 13.0442 1.82721H11.8137C11.7855 1.8272 11.758 1.82249 11.7308 1.81881H5.92134C5.01109 1.81884 4.19788 2.38681 3.88414 3.24128L1.93402 8.55247C1.59885 9.46536 1.86315 10.4909 2.59804 11.1278L3.93554 12.287C4.51736 12.7912 4.85232 13.5238 4.85239 14.2938V16.4254C4.85236 18.283 6.35795 19.7885 8.21554 19.7885C8.79044 19.7884 9.25714 19.3228 9.25722 18.7479V9.25112C9.25724 7.29523 10.0377 5.41991 11.4266 4.04273C11.6688 3.80262 12.0603 3.80473 12.3004 4.04693C12.5404 4.28914 12.5383 4.67959 12.2962 4.91972C11.1413 6.06493 10.4919 7.62466 10.4919 9.25112V18.7479C10.4918 20.005 9.47269 21.0242 8.21554 21.0243C5.67569 21.0242 3.61661 18.9652 3.61664 16.4254V14.2938C3.61658 13.8821 3.43783 13.4902 3.12675 13.2206L1.7882 12.0614C0.665609 11.0884 0.261983 9.52225 0.7738 8.12762L2.72393 2.81538C3.21621 1.47459 4.49303 0.583094 5.92134 0.583069H11.9396V0.59251Z"
            fill="currentColor"
          />
          <path
            d="M12.7263 14.2602C13.0325 14.11 13.4027 14.2372 13.553 14.5434L12.4441 15.0868C12.2941 14.7806 12.4202 14.4104 12.7263 14.2602Z"
            fill="currentColor"
          />
          <path
            d="M17.5298 8.99516C18.0167 8.99532 18.4118 9.38945 18.412 9.87633C18.412 10.3634 18.0168 10.7584 17.5298 10.7586C17.0426 10.7586 16.6476 10.3635 16.6476 9.87633C16.6478 9.38935 17.0428 8.99516 17.5298 8.99516Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ],
}

export const useCaseSolutions = {
  label: 'Solutions',
  solutions: [
    {
      id: Solutions.neon,
      text: 'Switch From Neon',
      description: '',
      url: '/solutions/switch-from-neon',
      icon: ArrowLeftRight,
    },
    {
      id: Solutions.startups,
      text: 'Startups',
      description: '',
      url: '/solutions/startups',
      icon: TrendingUpIcon,
    },
    {
      id: Solutions.enterprise,
      text: 'Enterprise',
      description: '',
      url: '/solutions/enterprise',
      icon: Building2Icon,
    },
  ],
}

export const navData = {
  navigation: [
    {
      label: 'Skill Level',
      links: [
        ...skillBasedSolutions.solutions.map((solution) => ({
          text: solution.text,
          url: solution.url,
          icon: solution.icon,
        })),
      ],
    },
    {
      label: "Who it's for",
      links: [
        ...useCaseSolutions.solutions.map((solution) => ({
          text: solution.text,
          url: solution.url,
          icon: solution.icon,
        })),
      ],
    },
  ],
}
