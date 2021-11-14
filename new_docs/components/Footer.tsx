import { Typography } from '@supabase/ui'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
const Footer = () => {
  return (
    <footer className={`${styles.footer} border-t dark:border-gray-600 `}>
      <div className="flex flex-row">
        <div>
          <Typography.Title level={4}>Company</Typography.Title>
          <Typography.Link>Blog</Typography.Link>
          <Typography.Link>Open Source</Typography.Link>
          <Typography.Link>Humans.txt</Typography.Link>
          <Typography.Link>Lawyers.txt</Typography.Link>
        </div>
        <div>
          <Typography.Title level={4}>Resources</Typography.Title>
          <Typography.Link>Brand Assets</Typography.Link>
          <Typography.Link>Docs</Typography.Link>
          <Typography.Link>Pricing</Typography.Link>
          <Typography.Link>Support</Typography.Link>
          <Typography.Link>System Status</Typography.Link>
        </div>
        <div>
          <Typography.Title level={4}>Community</Typography.Title>
          <Typography.Link>GitHub</Typography.Link>
          <Typography.Link>Twitter</Typography.Link>
          <Typography.Link>DevTo</Typography.Link>
          <Typography.Link>RSS</Typography.Link>
          <Typography.Link>Discord</Typography.Link>
        </div>
        <div>
          <Typography.Title level={4}>Beta</Typography.Title>
          <Typography.Link>Join our beta</Typography.Link>
        </div>
      </div>
      <div className="text-center w-full mt-8">
        <Typography.Text>Copyright &copy; {new Date().getFullYear()} Supabase.</Typography.Text>
      </div>
    </footer>
  )
}

export default Footer
