import { IS_PROD } from "common"

import { DEBUG_TELEMETRY } from "./constants"
import { unauthedAllowedPost } from "./fetch/fetchWrappers"

type TelemetryEvent = {
	category: string
	action: string
	label: string
	page_location: string
}

function sendTelemetryEvent(event: TelemetryEvent) {
	if (!IS_PROD && !DEBUG_TELEMETRY) return

	return unauthedAllowedPost('/platform/telemetry/event', {
		// @ts-ignore -- problem with the OpenAPI spec -- type of label is string | number
		body: event
	})
}

export { sendTelemetryEvent }
