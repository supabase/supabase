const TicketDisclaimer = ({ className, children }: { className?: string; children?: any }) => (
  <p className={['text-sm text-center text-[#9296AA90]', className].join(' ')}>
    {children || 'By registering you accept to receive email updates on Supabase Launch Week.'}
  </p>
)

export default TicketDisclaimer
