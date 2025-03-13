import { BaseTicketScene, SceneRenderContext } from "../TicketScene"

class SecretTicketScene extends BaseTicketScene {
    setup(context: SceneRenderContext): Promise<void> {
        throw new Error("Method not implemented.")
    }
}

export default SecretTicketScene
