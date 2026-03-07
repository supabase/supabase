'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import dart from 'react-syntax-highlighter/dist/cjs/languages/hljs/dart'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import xml from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml'
import { cn } from 'ui'

// Supabase docs theme: purple keywords, green functions/constants, peach strings
const supabaseDocsTheme = {
  dark: {
    hljs: {
      display: 'block',
      overflowX: 'auto' as const,
      background: 'transparent',
      color: '#ffffff',
    },
    'hljs-keyword': { color: '#bda4ff' },
    'hljs-selector-tag': { color: '#bda4ff' },
    'hljs-literal': { color: '#bda4ff' },
    'hljs-strong': { color: '#bda4ff' },
    'hljs-tag': { color: '#3ecf8e' },
    'hljs-name': { color: '#3ecf8e' },
    'hljs-title': { color: '#3ecf8e', fontWeight: 'normal' as const },
    'hljs-type': { color: '#3ecf8e', fontWeight: 'normal' as const },
    'hljs-built_in': { color: '#3ecf8e' },
    'hljs-builtin-name': { color: '#3ecf8e' },
    'hljs-section': { color: '#3ecf8e', fontWeight: 'normal' as const },
    'hljs-attribute': { color: '#3ecf8e' },
    'hljs-variable': { color: '#3ecf8e' },
    'hljs-string': { color: '#ffcda1' },
    'hljs-bullet': { color: '#ffcda1' },
    'hljs-subst': { color: '#ffcda1' },
    'hljs-emphasis': { color: '#ffcda1' },
    'hljs-addition': { color: '#ffcda1' },
    'hljs-template-tag': { color: '#ffcda1' },
    'hljs-template-variable': { color: '#ffcda1' },
    'hljs-selector-attr': { color: '#ffcda1' },
    'hljs-selector-pseudo': { color: '#ffcda1' },
    'hljs-symbol': { color: '#ffcda1' },
    'hljs-regexp': { color: '#ffcda1' },
    'hljs-link': { color: '#ffffff' },
    'hljs-comment': { color: '#7e7e7e' },
    'hljs-quote': { color: '#7e7e7e' },
    'hljs-deletion': { color: '#7e7e7e' },
    'hljs-meta': { color: '#7e7e7e' },
    'hljs-code': { color: '#3ecf8e' },
    'hljs-doctag': { fontWeight: 'normal' as const },
    'hljs-selector-id': { fontWeight: 'normal' as const },
  },
  light: {
    hljs: {
      display: 'block',
      overflowX: 'auto' as const,
      background: 'transparent',
      color: '#1f1f1f',
    },
    'hljs-keyword': { color: '#6b35dc' },
    'hljs-selector-tag': { color: '#6b35dc' },
    'hljs-literal': { color: '#6b35dc' },
    'hljs-strong': { color: '#6b35dc' },
    'hljs-tag': { color: '#15593b' },
    'hljs-name': { color: '#15593b' },
    'hljs-title': { color: '#15593b', fontWeight: 'normal' as const },
    'hljs-type': { color: '#15593b', fontWeight: 'normal' as const },
    'hljs-built_in': { color: '#15593b' },
    'hljs-builtin-name': { color: '#15593b' },
    'hljs-section': { color: '#15593b', fontWeight: 'normal' as const },
    'hljs-attribute': { color: '#15593b' },
    'hljs-variable': { color: '#15593b' },
    'hljs-string': { color: '#f1a10d' },
    'hljs-bullet': { color: '#f1a10d' },
    'hljs-subst': { color: '#f1a10d' },
    'hljs-emphasis': { color: '#f1a10d' },
    'hljs-addition': { color: '#f1a10d' },
    'hljs-template-tag': { color: '#f1a10d' },
    'hljs-template-variable': { color: '#f1a10d' },
    'hljs-selector-attr': { color: '#f1a10d' },
    'hljs-selector-pseudo': { color: '#f1a10d' },
    'hljs-symbol': { color: '#f1a10d' },
    'hljs-regexp': { color: '#f1a10d' },
    'hljs-link': { color: '#1f1f1f' },
    'hljs-comment': { color: '#7e7e7e' },
    'hljs-quote': { color: '#7e7e7e' },
    'hljs-deletion': { color: '#7e7e7e' },
    'hljs-meta': { color: '#7e7e7e' },
    'hljs-code': { color: '#15593b' },
    'hljs-doctag': { fontWeight: 'normal' as const },
    'hljs-selector-id': { fontWeight: 'normal' as const },
  },
}

SyntaxHighlighter.registerLanguage('js', js)
SyntaxHighlighter.registerLanguage('dart', dart)
SyntaxHighlighter.registerLanguage('xml', xml)

const frameworksList: {
  name: string
  icon: string
  code: string
  lang: 'js' | 'dart' | 'xml'
}[] = [
  {
    name: 'React',
    icon: 'M45.74 23.6983C45.2739 23.5379 44.7909 23.3861 44.2937 23.2426C44.3754 22.909 44.4504 22.5798 44.5171 22.2561C45.6119 16.9418 44.8961 12.6605 42.4518 11.2509C40.1079 9.89927 36.2748 11.3085 32.4035 14.6776C32.0313 15.0016 31.6579 15.3446 31.2848 15.704C31.0362 15.4662 30.7879 15.2364 30.5403 15.0165C26.4831 11.4141 22.4164 9.89599 19.9744 11.3097C17.6329 12.6652 16.9394 16.69 17.9249 21.7265C18.0201 22.2129 18.1313 22.7097 18.2571 23.2148C17.6816 23.3782 17.1259 23.5524 16.5943 23.7377C11.8376 25.3961 8.7998 27.9952 8.7998 30.6911C8.7998 33.4755 12.0609 36.2683 17.0153 37.9617C17.4063 38.0953 17.812 38.2217 18.2301 38.3416C18.0944 38.8879 17.9763 39.4232 17.8773 39.9454C16.9376 44.8944 17.6714 48.8242 20.0068 50.1711C22.4189 51.5622 26.4673 50.1324 30.4093 46.6865C30.7209 46.4141 31.0336 46.1253 31.3469 45.8225C31.7529 46.2135 32.1582 46.5835 32.5615 46.9306C36.3798 50.2164 40.151 51.5432 42.4842 50.1925C44.894 48.7975 45.6772 44.576 44.6604 39.4399C44.5828 39.0476 44.4924 38.6469 44.3909 38.239C44.6752 38.155 44.9543 38.0682 45.2265 37.978C50.3771 36.2715 53.7282 33.5127 53.7282 30.6911C53.7282 27.9854 50.5924 25.3688 45.74 23.6983ZM44.6228 36.1561C44.3772 36.2375 44.1251 36.3161 43.8682 36.3923C43.2996 34.5922 42.5322 32.6781 41.5931 30.7005C42.4893 28.7699 43.227 26.8803 43.7797 25.0919C44.2393 25.2249 44.6854 25.3651 45.1152 25.5132C49.2728 26.9444 51.8089 29.0605 51.8089 30.6911C51.8089 32.4279 49.07 34.6826 44.6228 36.1561ZM42.7776 39.8126C43.2272 42.0837 43.2914 44.1371 42.9936 45.7423C42.726 47.1847 42.1878 48.1463 41.5225 48.5315C40.1066 49.351 37.0787 48.2857 33.8132 45.4757C33.4388 45.1535 33.0618 44.8096 32.6835 44.4455C33.9495 43.061 35.2147 41.4514 36.4495 39.6638C38.6215 39.4711 40.6735 39.156 42.5344 38.7258C42.626 39.0955 42.7074 39.4581 42.7776 39.8126ZM24.1169 48.3898C22.7336 48.8784 21.6318 48.8924 20.9658 48.5084C19.5486 47.691 18.9594 44.5358 19.7631 40.3033C19.8551 39.8186 19.9647 39.3207 20.091 38.8118C21.9314 39.2187 23.9684 39.5116 26.1456 39.6881C27.3887 41.4373 28.6905 43.0452 30.0024 44.453C29.7157 44.7297 29.4302 44.9931 29.1463 45.2413C27.4032 46.7651 25.6564 47.8461 24.1169 48.3898ZM17.6361 36.1455C15.4453 35.3967 13.6361 34.4235 12.396 33.3616C11.2817 32.4073 10.7191 31.4599 10.7191 30.6911C10.7191 29.0551 13.1581 26.9684 17.226 25.5501C17.7196 25.378 18.2363 25.2158 18.7725 25.0635C19.3347 26.8923 20.0722 28.8043 20.9623 30.7378C20.0607 32.7 19.3128 34.6425 18.745 36.4927C18.3628 36.3829 17.9924 36.2672 17.6361 36.1455ZM19.8085 21.3579C18.9642 17.0428 19.5249 13.7876 20.936 12.9708C22.4391 12.1006 25.7628 13.3413 29.2659 16.4518C29.4898 16.6506 29.7146 16.8587 29.9401 17.074C28.6347 18.4756 27.3448 20.0714 26.1127 21.8103C23.9997 22.0061 21.977 22.3208 20.1174 22.742C20.0004 22.2717 19.8969 21.8097 19.8085 21.3579ZM39.1886 26.1433C38.744 25.3754 38.2876 24.6257 37.8223 23.8964C39.2558 24.0777 40.6293 24.3182 41.9191 24.6126C41.5318 25.8536 41.0492 27.1511 40.4811 28.4813C40.0735 27.7076 39.6425 26.9275 39.1886 26.1433ZM31.2854 18.4456C32.1707 19.4047 33.0573 20.4756 33.9293 21.6374C33.0506 21.5959 32.161 21.5743 31.264 21.5743C30.3755 21.5743 29.4925 21.5954 28.6192 21.6362C29.4921 20.4852 30.3863 19.4158 31.2854 18.4456ZM23.3317 26.1566C22.8876 26.9267 22.4645 27.7025 22.0634 28.4799C21.5045 27.1543 21.0263 25.8509 20.6357 24.5923C21.9176 24.3054 23.2846 24.0709 24.7089 23.8931C24.2371 24.6291 23.7769 25.3843 23.3317 26.1564V26.1566ZM24.75 37.626C23.2783 37.4618 21.8908 37.2394 20.6093 36.9604C21.0061 35.6793 21.4948 34.3481 22.0655 32.994C22.4677 33.7707 22.8925 34.5469 23.3393 35.3187H23.3393C23.7945 36.1049 24.266 36.875 24.75 37.626ZM31.3385 43.0719C30.4289 42.0904 29.5215 41.0047 28.6353 39.8368C29.4956 39.8706 30.3726 39.8879 31.264 39.8879C32.1798 39.8879 33.085 39.8672 33.9761 39.8276C33.1012 41.0164 32.2178 42.1038 31.3385 43.0719ZM40.4994 32.9249C41.0999 34.2937 41.6061 35.618 42.0081 36.8772C40.7054 37.1744 39.2989 37.4138 37.8171 37.5916C38.2835 36.8525 38.7439 36.0899 39.1963 35.3055C39.6539 34.5118 40.0885 33.717 40.4994 32.9249ZM37.5337 34.3466C36.8314 35.5643 36.1104 36.7268 35.3784 37.8241C34.0452 37.9194 32.6678 37.9685 31.264 37.9685C29.8659 37.9685 28.5058 37.9251 27.1962 37.8401C26.4347 36.7284 25.698 35.5625 25.0002 34.3571H25.0004C24.3044 33.155 23.6638 31.9427 23.0834 30.7372C23.6636 29.5289 24.3025 28.3152 24.9945 27.1152L24.9944 27.1155C25.6882 25.9123 26.4184 24.7521 27.1729 23.6473C28.509 23.5463 29.8792 23.4936 31.2639 23.4936H31.264C32.655 23.4936 34.0269 23.5467 35.3626 23.6486C36.1056 24.7453 36.8308 25.9017 37.5274 27.1051C38.2319 28.3219 38.879 29.5275 39.4642 30.7099C38.8808 31.9126 38.2351 33.1303 37.5337 34.3466ZM41.4931 12.9137C42.9976 13.7813 43.5826 17.2804 42.6374 21.8688C42.5771 22.1615 42.5092 22.4597 42.4354 22.762C40.5715 22.3319 38.5474 22.0118 36.4282 21.813C35.1937 20.055 33.9143 18.4567 32.6302 17.0731C32.9755 16.741 33.3202 16.4243 33.6636 16.1254C36.9805 13.2388 40.0806 12.0991 41.4931 12.9137ZM31.264 26.6791C33.4797 26.6791 35.276 28.4753 35.276 30.6911C35.276 32.9068 33.4797 34.703 31.264 34.703C29.0483 34.703 27.252 32.9068 27.252 30.6911C27.252 28.4753 29.0483 26.6791 31.264 26.6791Z',
    code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default function App() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    supabase.from('todos').select('*')
      .then(({ data }) => setTodos(data))
  }, [])

  return <TodoList items={todos} />
}`,
    lang: 'js' as const,
  },
  {
    name: 'Next.js',
    icon: 'M42.3148 48.6796C38.9009 50.9525 34.8014 52.2771 30.3924 52.2771C18.4957 52.2771 8.85156 42.6329 8.85156 30.7362C8.85156 18.8395 18.4957 9.19531 30.3924 9.19531C42.2891 9.19531 51.9333 18.8395 51.9333 30.7362C51.9333 37.1564 49.1245 42.9207 44.6688 46.8671L39.5552 40.2803V21.8278H36.584V36.4531L25.2299 21.8278H21.4808V39.6473H24.4801V25.6368L42.3148 48.6796Z',
    code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function Page() {
  const { data: todos } = await supabase
    .from('todos')
    .select('*')

  return <TodoList items={todos} />
}`,
    lang: 'js' as const,
  },
  {
    name: 'Flutter',
    icon: 'M46.5067 10.3828L34.3509 10.3962L14.75 29.9971L20.7974 36.0519L26.1125 30.7666L46.5067 10.3828Z M34.6996 28.4653C34.5272 28.4573 34.3493 28.4491 34.2378 28.5965L23.7856 39.0471L29.7894 45.0142L29.7825 45.021L34.079 49.3212C34.1072 49.3462 34.1352 49.3741 34.1637 49.4026C34.2813 49.5201 34.4074 49.6462 34.5895 49.6055C36.5743 49.601 38.5591 49.6017 40.544 49.6025C42.529 49.6032 44.5142 49.604 46.4998 49.5995L35.9333 39.0234L46.4963 28.467L34.906 28.464C34.8415 28.4719 34.7711 28.4686 34.6996 28.4653Z',
    code: `import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  runApp(MyApp());
}

final supabase = Supabase.instance.client;

final data = await supabase
    .from('todos')
    .select('*');`,
    lang: 'dart' as const,
  },
  {
    name: 'Svelte',
    icon: 'M29.9094 11.2292C35.956 7.37668 44.3187 9.17299 48.553 15.2334H48.5532C50.5831 18.0746 51.3826 21.614 50.771 25.0519C50.4778 26.677 49.8581 28.2259 48.9493 29.6047C50.2752 32.1335 50.7201 35.0322 50.2136 37.8422C49.6086 41.2154 47.6106 44.1777 44.7096 46.0024L34.0903 52.7707C28.0445 56.623 19.6818 54.8274 15.4466 48.7665C13.4171 45.9251 12.6176 42.3859 13.2288 38.948C13.5223 37.3227 14.1422 35.7738 15.0512 34.3949C13.7247 31.8665 13.2794 28.9677 13.786 26.1577C14.3913 22.7845 16.3893 19.8223 19.29 17.9974L29.9094 11.2292ZM19.8146 45.9861C21.8311 48.8931 25.4469 50.2333 28.8709 49.343H28.8708C29.6345 49.139 30.3624 48.8192 31.0293 48.3946L41.6512 41.6252C43.396 40.5274 44.5979 38.7455 44.9622 36.7164C45.33 34.6483 44.8489 32.5192 43.6278 30.8101C41.6113 27.9032 37.9955 26.5629 34.5715 27.4531C33.8084 27.6571 33.081 27.9768 32.4147 28.4012L28.3617 30.9842C28.1601 31.1125 27.9401 31.2092 27.7093 31.271C26.6776 31.5384 25.5887 31.1342 24.9815 30.2584C24.614 29.7429 24.4693 29.1012 24.5801 28.4779C24.6899 27.8669 25.0519 27.3302 25.5774 26.9996L36.2002 20.2298C36.4017 20.1015 36.6218 20.0048 36.8526 19.9431C37.8838 19.6754 38.9725 20.0795 39.5793 20.9551C39.9039 21.4146 40.0556 21.974 40.0078 22.5345L39.9714 22.9285L40.3662 23.0484C41.8596 23.4989 43.265 24.2014 44.5218 25.1254L45.0657 25.5245L45.2658 24.9145C45.3729 24.59 45.4577 24.2586 45.5196 23.9225C45.8873 21.8544 45.4063 19.7254 44.1852 18.0162C42.1687 15.1093 38.553 13.7691 35.129 14.6593C34.3653 14.8633 33.6374 15.1832 32.9705 15.6077L22.3487 22.3777C20.6036 23.475 19.4016 25.2568 19.0376 27.2858C18.6699 29.3539 19.1509 31.4829 20.372 33.192C22.3885 36.099 26.0043 37.4392 29.4283 36.549C30.1914 36.345 30.9188 36.0256 31.5853 35.6017L35.6389 33.0177C35.8402 32.8895 36.06 32.7929 36.2905 32.7311C37.3221 32.4637 38.4111 32.868 39.0183 33.7438C39.3857 34.2592 39.5306 34.9007 39.4205 35.524C39.3102 36.1352 38.948 36.6718 38.4224 37.0028L27.7996 43.7722C27.5981 43.9006 27.378 43.9973 27.1471 44.059C26.116 44.3266 25.0273 43.9225 24.4204 43.0469C24.0955 42.5876 23.9438 42.0281 23.992 41.4675L24.0284 41.0735L23.6336 40.9537C22.1404 40.5032 20.7351 39.8011 19.4783 38.8776L18.934 38.4778L18.734 39.0878C18.6266 39.4122 18.5418 39.7437 18.4801 40.0798C18.1125 42.1479 18.5935 44.277 19.8146 45.9861Z',
    code: `<script>
  import { createClient } from '@supabase/supabase-js'

  const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  )

  let todos = []

  async function loadTodos() {
    const { data } = await supabase
      .from('todos').select('*')
    todos = data
  }
</script>`,
    lang: 'xml' as const,
  },
  {
    name: 'Vue',
    icon: 'M43.0532 13.4531H50.1147L30.2756 47.8158L10.4365 13.4531H17.4978L30.2755 35.5845L43.0532 13.4531ZM42.1764 13.4531L30.2755 34.0659L18.3746 13.4531L25.6939 13.4531L30.2756 21.3888L34.8572 13.4531L42.1764 13.4531Z',
    code: `<script setup>
import { createClient } from '@supabase/supabase-js'
import { ref, onMounted } from 'vue'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const todos = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('todos').select('*')
  todos.value = data
})
</script>`,
    lang: 'xml' as const,
  },
  {
    name: 'Nuxt',
    icon: 'M32.5784 45.4741H50.2199C50.7802 45.4741 51.3307 45.3325 51.8159 45.0634C52.3012 44.7943 52.7041 44.4072 52.9842 43.9409C53.2642 43.4748 53.4115 42.946 53.4113 42.4078C53.4111 41.8696 53.2633 41.3409 52.9828 40.875L41.1352 21.164C40.8552 20.6979 40.4524 20.3109 39.9672 20.0418C39.4821 19.7727 38.9317 19.631 38.3715 19.631C37.8113 19.631 37.261 19.7727 36.7758 20.0418C36.2906 20.3109 35.8878 20.6979 35.6078 21.164L32.5784 26.2073L26.6555 16.3452C26.3753 15.8792 25.9723 15.4922 25.487 15.2232C25.0017 14.9541 24.4513 14.8125 23.8909 14.8125C23.3306 14.8125 22.7802 14.9541 22.2949 15.2232C21.8096 14.9541 21.4066 15.8792 21.1263 16.3452L6.38358 40.875C6.10311 41.3409 5.95532 41.8696 5.95508 42.4078C5.95483 42.946 6.10214 43.4748 6.38219 43.9409C6.66224 44.4072 7.06515 44.7943 7.5504 45.0634C8.03564 45.3325 8.58612 45.4741 9.14645 45.4741H20.2203C24.6079 45.4741 27.8436 43.6229 30.07 40.0113L38.3706 26.2073L47.0599 40.6619H35.4754L32.5784 45.4741Z',
    code: `<script setup>
const supabase = useSupabaseClient()

const { data: todos } = await useAsyncData(
  'todos',
  async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
    return data
  }
)
</script>

<template>
  <TodoList :items="todos" />
</template>`,
    lang: 'xml' as const,
  },
]

export function FrameworksSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark') ?? false
  const [activeIdx, setActiveIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const active = frameworksList[activeIdx]

  useEffect(() => setMounted(true), [])

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] pl-6 border-x border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: title */}
          <div className="flex items-center py-16 lg:py-24 pr-6">
            <div className="text-2xl md:text-4xl text-foreground-lighter">
              Use Supabase with{' '}
              <span className="block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active.name}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { duration: 0.25 } }}
                    exit={{ y: 0, opacity: 0, transition: { duration: 0.1 } }}
                    className="inline-block text-foreground"
                  >
                    {active.name}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>

          {/* Right: icon tabs + code */}
          <div className="border-l border-border flex flex-col">
            {/* 6-col icon row */}
            <div className="grid grid-cols-6 border-b border-border">
              {frameworksList.map((framework, index) => (
                <button
                  key={framework.name}
                  onClick={() => setActiveIdx(index)}
                  className={cn(
                    'flex items-center justify-center py-4 border-r border-border last:border-r-0 transition-colors',
                    index === activeIdx
                      ? 'bg-surface-75 text-foreground'
                      : 'text-foreground-muted hover:text-foreground-light hover:bg-surface-75/50'
                  )}
                >
                  <svg
                    width={28}
                    height={28}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    viewBox="0 0 61 61"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={framework.icon} fill="currentColor" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Code area */}
            <div className="h-[440px] overflow-auto">
              {mounted && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                    exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  >
                    {/* @ts-ignore */}
                    <SyntaxHighlighter
                      language={active.lang}
                      style={isDark ? supabaseDocsTheme.dark : supabaseDocsTheme.light}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'transparent',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        lineHeight: 1.7,
                      }}
                    >
                      {active.code}
                    </SyntaxHighlighter>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
