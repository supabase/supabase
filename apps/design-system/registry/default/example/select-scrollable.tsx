import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export default function SelectScrollable() {
  return (
    <Select_Shadcn_>
      <SelectTrigger_Shadcn_ className="w-[280px]">
        <SelectValue_Shadcn_ placeholder="Select a timezone" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>North America</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="est">Eastern Standard Time (EST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="cst">Central Standard Time (CST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="mst">Mountain Standard Time (MST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="pst">Pacific Standard Time (PST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="akst">Alaska Standard Time (AKST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="hst">Hawaii Standard Time (HST)</SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Europe & Africa</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="gmt">Greenwich Mean Time (GMT)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="cet">Central European Time (CET)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="eet">Eastern European Time (EET)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="west">Western European Summer Time (WEST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="cat">Central Africa Time (CAT)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="eat">East Africa Time (EAT)</SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Asia</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="msk">Moscow Time (MSK)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="ist">India Standard Time (IST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="cst_china">China Standard Time (CST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="jst">Japan Standard Time (JST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="kst">Korea Standard Time (KST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="ist_indonesia">
            Indonesia Central Standard Time (WITA)
          </SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Australia & Pacific</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="awst">
            Australian Western Standard Time (AWST)
          </SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="acst">
            Australian Central Standard Time (ACST)
          </SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="aest">
            Australian Eastern Standard Time (AEST)
          </SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="nzst">New Zealand Standard Time (NZST)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="fjt">Fiji Time (FJT)</SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>South America</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="art">Argentina Time (ART)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="bot">Bolivia Time (BOT)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="brt">Brasilia Time (BRT)</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="clt">Chile Standard Time (CLT)</SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
