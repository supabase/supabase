export class ApplicationError extends Error {
    constructor(message, data = {}){
        super(message);
        this.data = data;
    }
    data;
}
export class UserError extends ApplicationError {
}
