import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="typescript">
        {`
  import { supabase } from "$lib/supabaseClient";

  export async function load() {
    const { data } = await supabase.from("countries").select();
    return {
      countries: data ?? [],
    };
  }
`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
