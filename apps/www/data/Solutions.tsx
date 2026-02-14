import {
  BotIcon,
  Building2Icon,
  Code2Icon,
  HammerIcon,
  LightbulbIcon,
  PointerIcon,
  PuzzleIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react'

export type SolutionTypes = Solutions[keyof Solutions]

export enum Solutions {
  aiBuilders = 'ai-builders',
  noCode = 'no-code',
  beginners = 'beginners',
  developers = 'developers',
  postgresDevs = 'postgres-developers',
  firebase = 'firebase',
  neon = 'neon',
  startups = 'startups',
  agencies = 'agencies',
  enterprise = 'enterprise',
  hackathon = 'hackathon',
  innovationTeams = 'innovation-teams',
  vibeCoders = 'vibe-coders',
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
    {
      id: Solutions.vibeCoders,
      text: 'Vibe Coders',
      description: '',
      url: '/solutions/vibe-coders',
      icon: ZapIcon,
    },
  ],
}

export const useCaseSolutions = {
  label: 'Solutions',
  solutions: [
    {
      id: Solutions.hackathon,
      text: 'Hackathon Contestants',
      description: '',
      url: '/solutions/hackathon',
      icon: HammerIcon,
    },
    {
      id: Solutions.startups,
      text: 'Startups',
      description: '',
      url: '/solutions/startups',
      icon: TrendingUpIcon,
    },
    {
      id: Solutions.agencies,
      text: 'Agencies',
      description: '',
      url: '/solutions/agencies',
      icon: UsersIcon,
    },
    {
      id: Solutions.enterprise,
      text: 'Enterprise',
      description: '',
      url: '/solutions/enterprise',
      icon: Building2Icon,
    },
    {
      id: Solutions.innovationTeams,
      text: 'Innovation Teams',
      description: '',
      url: '/solutions/innovation-teams',
      icon: LightbulbIcon,
    },
  ],
}

export const migrationSolutions = {
  label: 'Solutions',
  solutions: [
    {
      id: Solutions.firebase,
      text: 'Switch from Firebase',
      description: '',
      url: '/solutions/switch-from-firebase',
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 600 600" {...props}>
          <path
            fill="#FF9100"
            d="M213.918 560.499c23.248 9.357 48.469 14.909 74.952 15.834 35.84 1.252 69.922-6.158 100.391-20.234-36.537-14.355-69.627-35.348-97.869-61.448-18.306 29.31-45.382 52.462-77.474 65.848"
          ></path>
          <path
            fill="#FFC400"
            d="M291.389 494.66c-64.466-59.622-103.574-145.917-100.269-240.568.108-3.073.27-6.145.46-9.216a167 167 0 0 0-36.004-5.241 167 167 0 0 0-51.183 6.153c-17.21 30.145-27.594 64.733-28.888 101.781-3.339 95.611 54.522 179.154 138.409 212.939 32.093-13.387 59.168-36.51 77.475-65.848"
          ></path>
          <path
            fill="#FF9100"
            d="M291.39 494.657c14.988-23.986 24.075-52.106 25.133-82.403 2.783-79.695-50.792-148.251-124.942-167.381-.19 3.071-.352 6.143-.46 9.216-3.305 94.651 35.803 180.946 100.269 240.568"
          ></path>
          <path
            fill="#DD2C00"
            d="M308.231 20.858C266 54.691 232.652 99.302 212.475 150.693c-11.551 29.436-18.81 61.055-20.929 94.2 74.15 19.13 127.726 87.686 124.943 167.38-1.058 30.297-10.172 58.39-25.134 82.404 28.24 26.127 61.331 47.093 97.868 61.447 73.337-33.9 125.37-106.846 128.383-193.127 1.952-55.901-19.526-105.724-49.875-147.778-32.051-44.477-159.5-194.36-159.5-194.36Z"
          ></path>
        </svg>
      ),
    },
    {
      id: Solutions.neon,
      text: 'Switch from Neon',
      description: '',
      url: '/solutions/switch-from-neon',
      icon: (props: any) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
          viewBox="0 0 256 256"
          {...props}
        >
          <defs>
            <linearGradient id="neon__a" x1="100%" x2="12.069%" y1="100%" y2="0%">
              <stop offset="0%" stopColor="#62F755"></stop>
              <stop offset="100%" stopColor="#8FF986" stopOpacity="0"></stop>
            </linearGradient>
            <linearGradient id="neon__b" x1="100%" x2="40.603%" y1="100%" y2="76.897%">
              <stop offset="0%" stopOpacity="0.9"></stop>
              <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0"></stop>
            </linearGradient>
          </defs>
          <path
            fill="#00E0D9"
            d="M0 44.139C0 19.762 19.762 0 44.139 0H211.86C236.238 0 256 19.762 256 44.139v142.649c0 25.216-31.915 36.16-47.388 16.256l-48.392-62.251v75.484c0 21.939-17.784 39.723-39.722 39.723h-76.36C19.763 256 0 236.238 0 211.861zm44.139-8.825a8.817 8.817 0 0 0-8.825 8.818v167.73c0 4.878 3.946 8.831 8.818 8.831h77.688c2.44 0 3.087-1.977 3.087-4.416v-101.22c0-25.222 31.914-36.166 47.395-16.255l48.391 62.243V44.14c0-4.879.455-8.825-4.416-8.825H44.14Z"
          ></path>
          <path
            fill="url(#neon__a)"
            d="M0 44.139C0 19.762 19.762 0 44.139 0H211.86C236.238 0 256 19.762 256 44.139v142.649c0 25.216-31.915 36.16-47.388 16.256l-48.392-62.251v75.484c0 21.939-17.784 39.723-39.722 39.723h-76.36C19.763 256 0 236.238 0 211.861zm44.139-8.825a8.817 8.817 0 0 0-8.825 8.818v167.73c0 4.878 3.946 8.831 8.818 8.831h77.688c2.44 0 3.087-1.977 3.087-4.416v-101.22c0-25.222 31.914-36.166 47.395-16.255l48.391 62.243V44.14c0-4.879.455-8.825-4.416-8.825H44.14Z"
          ></path>
          <path
            fill="url(#neon__b)"
            fillOpacity="0.4"
            d="M0 44.139C0 19.762 19.762 0 44.139 0H211.86C236.238 0 256 19.762 256 44.139v142.649c0 25.216-31.915 36.16-47.388 16.256l-48.392-62.251v75.484c0 21.939-17.784 39.723-39.722 39.723h-76.36C19.763 256 0 236.238 0 211.861zm44.139-8.825a8.817 8.817 0 0 0-8.825 8.818v167.73c0 4.878 3.946 8.831 8.818 8.831h77.688c2.44 0 3.087-1.977 3.087-4.416v-101.22c0-25.222 31.914-36.166 47.395-16.255l48.391 62.243V44.14c0-4.879.455-8.825-4.416-8.825H44.14Z"
          ></path>
          <path
            fill="#63F655"
            d="M211.861 0C236.238 0 256 19.762 256 44.139v142.649c0 25.216-31.915 36.16-47.388 16.256l-48.392-62.251v75.484c0 21.939-17.784 39.723-39.722 39.723a4.41 4.41 0 0 0 4.409-4.409V115.058c0-25.223 31.914-36.167 47.395-16.256l48.391 62.243V8.825c0-4.871-3.953-8.825-8.832-8.825"
          ></path>
        </svg>
      ),
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
    {
      label: 'Migration',
      links: [
        ...migrationSolutions.solutions.map((solution) => ({
          text: solution.text,
          url: solution.url,
          icon: solution.icon,
        })),
      ],
    },
  ],
}
