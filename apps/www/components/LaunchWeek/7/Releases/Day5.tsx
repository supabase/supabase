import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import {
  ArrowTopRightSvg,
  CartTitle,
  ChipLink,
  MultistepSectionHeader,
  SectionButtons,
  StyledArticleBadge,
} from './components'

import { WeekDayProps } from '~/components/LaunchWeek/7/lw7_days'
import { opacityVariant4, scaleOpacityVariant2 } from '.'

import styles from './day5.module.css'
import Link from 'next/link'

const getDay5Motion = (index: number) => {
  switch (index) {
    case 0:
      return scaleOpacityVariant2
    default:
      return undefined
  }
}

const getDay5omt01Motion = (index: number) => {
  switch (index) {
    case 2:
      return opacityVariant4
    default:
      return undefined
  }
}
const getDay5omt02Motion = (index: number) => {
  switch (index) {
    case 2:
      return opacityVariant4
    default:
      return undefined
  }
}

const Day5 = ({ day }: { day: WeekDayProps }) => {
  const isMobile = useBreakpoint(767)
  const isTablet = useBreakpoint(1023)
  const isDesktop = useBreakpoint(1279)

  return (
    <>
      {/* Community */}
      <div className="h-auto flex flex-col gap-5 lg:flex-row">
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 xs:text-2xl text-xl sm:text-2xl md:text-xl text-center shadow-lg
                      min-h-[400px]
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
        >
          <div className="flex items-center text-center lg:text-left justify-between flex-col lg:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[0].steps[0].title}</CartTitle>
            <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
          </div>
          <SectionButtons blog={day.steps[0].steps[0].blog} />
          {day.steps[0]?.steps[0]?.bg_layers &&
            day.steps[0].steps[0].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
      </div>
      {/* Studio */}
      <MultistepSectionHeader title={day.steps[1].title} blog={day.steps[1].blog} />
      <div
        className={[
          'h-auto flex flex-col sm:grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-5 lg:flex-row',
          styles['day5-grid'],
        ].join(' ')}
      >
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 md:items-start justify-between
                      col-span-full grid-ro w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-xl sm:text-2xl md:text-xl text-center shadow-lg
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'commandK' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[0].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center md:text-left justify-between flex-col md:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[0].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[4].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[0].bg_layers &&
            day.steps[1].steps[0].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isMobile ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isMobile ? '50% 50%' : '80% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 md:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'wrappers' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[1].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center md:text-left justify-between flex-col md:items-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[1].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge>{day.steps[1].steps[1].badge}</StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[1].bg_layers &&
            day.steps[1].steps[1].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isMobile ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isMobile ? '50% 50%' : '80% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 py-10 text-center 
                      min-h-[350px] md:min-h-[220px]
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'nullable' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[2].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex flex-col items-center text-center gap-3 text-white">
            <CartTitle>{day.steps[1].steps[2].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[2].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[2].bg_layers &&
            day.steps[1].steps[2].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isMobile ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={isMobile ? '50% 70%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 py-10 text-center 
                      min-h-[350px] md:min-h-[220px]
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'apiAutodocs' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[3].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center flex-col gap-3 text-white">
            <CartTitle>{day.steps[1].steps[3].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[3].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[3].bg_layers &&
            day.steps[1].steps[3].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={isMobile ? '50% 90%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center
                      h-auto min-h-[400px] md:min-h-[600px] xl:min-h-full
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'pgRoles' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[4].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center lg:text-left justify-between flex-col lg:flex-row lg:justify-start gap-3 lg:gap-2 text-white">
            <CartTitle>{day.steps[1].steps[4].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[4].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[4].bg_layers &&
            day.steps[1].steps[4].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center
                      h-auto min-h-[400px] md:min-h-[600px] xl:min-h-full
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'casDeletes' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[5].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center lg:text-left justify-between flex-col lg:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[5].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[5].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[5].bg_layers &&
            day.steps[1].steps[5].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 md:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'graphiQL' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[6].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center md:text-left justify-between flex-col md:flex-row md:justify-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[6].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="md:ml-2">
                {day.steps[1].steps[6].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[6].bg_layers &&
            day.steps[1].steps[6].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[`absolute w-full h-full -z-10 transition-all duration-300`].join(
                        ' '
                      )}
                      fill
                      objectPosition={isMobile ? '0% 50%' : isDesktop ? '100% 50%' : '0% 50%'}
                      objectFit={isMobile ? 'cover' : isDesktop ? 'contain' : 'cover'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'dbWebhooks' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[7].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center lg:text-left justify-between flex-col lg:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[7].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[7].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[7].bg_layers &&
            day.steps[1].steps[7].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'viewsTables' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[9].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center flex-col gap-3 text-white">
            <CartTitle>{day.steps[1].steps[8].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[8].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[8].bg_layers &&
            day.steps[1].steps[8].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 py-10 text-center 
                      min-h-[350px] md:min-h-[220px]
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'JSONsupport' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[9].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center flex-col gap-3 text-white">
            <CartTitle>{day.steps[1].steps[9].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[9].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[9].bg_layers &&
            day.steps[1].steps[9].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[350px] md:min-h-[220px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
          style={{ gridArea: 'insights' }}
        >
          <Link
            href={`${day.steps[1].blog}${day.steps[1].steps[10].url}`}
            className="absolute inset-0 z-10"
          />
          <div className="flex items-center text-center lg:text-left justify-between flex-col lg:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[1].steps[10].title}</CartTitle>
            <div className="flex gap-2">
              <StyledArticleBadge className="lg:ml-2">
                {day.steps[1].steps[10].badge}
              </StyledArticleBadge>
              <ChipLink
                uiOnly
                className="!min-h-[28px] !min-w-[28px] !p-0 !items-center !justify-center"
              >
                <ArrowTopRightSvg />
              </ChipLink>
            </div>
          </div>
          {day.steps[1].steps[10].bg_layers &&
            day.steps[1].steps[10].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                    variants={getDay5Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isTablet ? '50% 50%' : '50% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
      </div>
      {/* One More Thing */}
      <MultistepSectionHeader title={day.steps[2].title} />
      <div className="h-auto flex flex-col md:grid md:grid-cols-3 gap-5 lg:flex-row">
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 md:items-start justify-between
                      grid-ro w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-xl sm:text-2xl md:text-xl text-center shadow-lg
                      min-h-[400px] md:min-h-[250px] col-span-2
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
        >
          <div className="flex items-center text-center md:text-left justify-between flex-col md:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[2].steps[0].title}</CartTitle>
            <StyledArticleBadge className="lg:ml-2">
              {day.steps[2].steps[0].badge}
            </StyledArticleBadge>
          </div>
          <SectionButtons blog={day.steps[2].steps[0].blog} />
          {day.steps[2].steps[0].bg_layers &&
            day.steps[2].steps[0].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={[
                      'absolute inset-0 w-full h-full -z-10',
                      i === 2 && '!mix-blend-overlay blur-2xl',
                    ].join(' ')}
                    variants={getDay5omt01Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isMobile ? (layer.mobileImg as any) : layer.img}
                      className={[
                        `absolute w-full h-full -z-10 transition-all duration-300 object-cover`,
                      ].join(' ')}
                      fill
                      objectPosition={!!layer.mobileImg && isMobile ? '50% 50%' : '80% 50%'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
        <motion.div
          className={`
                      relative overflow-hidden flex-1 flex flex-col items-center gap-5 md:items-start justify-between text-xl sm:text-2xl md:text-xl shadow-lg
                      w-full border rounded-xl px-4 sm:px-8 lg:px-14 py-10 text-center 
                      min-h-[400px] md:min-h-[250px] 
                    `}
          initial="default"
          animate="default"
          whileHover="hover"
        >
          <div className="flex items-center text-center md:text-left justify-between flex-col md:flex-row lg:justify-start gap-3 text-white">
            <CartTitle>{day.steps[2].steps[1].title}</CartTitle>
            <StyledArticleBadge>{day.steps[2].steps[1].badge}</StyledArticleBadge>
          </div>
          <SectionButtons blog={day.steps[2].steps[1].blog} />
          {day.steps[2].steps[1].bg_layers &&
            day.steps[2].steps[1].bg_layers?.map(
              (layer, i) =>
                !!layer.img && (
                  <motion.div
                    className={[
                      'absolute inset-0 w-full h-full -z-10',
                      i === 2 && '!mix-blend-overlay opacity-50 blur-2xl',
                    ].join(' ')}
                    variants={getDay5omt02Motion(i)}
                  >
                    <Image
                      src={!!layer.mobileImg && isMobile ? (layer.mobileImg as any) : layer.img}
                      className={[`absolute w-full h-full -z-10 transition-all duration-300`].join(
                        ' '
                      )}
                      fill
                      objectPosition={
                        i == 1 && !!layer.mobileImg && isMobile ? '50% 60%' : '80% 50%'
                      }
                      objectFit={i == 1 && !!layer.mobileImg && isMobile ? 'contain' : 'cover'}
                      quality={100}
                      alt=""
                    />
                  </motion.div>
                )
            )}
        </motion.div>
      </div>
    </>
  )
}

export default Day5
