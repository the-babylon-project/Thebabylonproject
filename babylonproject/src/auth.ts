import createAuth0Client, {Auth0Client} from "auth0-spa-ts";

export class Auth0Service {
    private auth0Client: Auth0Client;

    async initAuth0(): Promise<void> {
        this.auth0Client = await createAuth0Client({
            domain: "dev-ur0ubhr1.us.auth0.com",
            client_id: "aGQ9dLNQoW94k7UE8HuEu8oI4Oy4E2vn",
            cacheLocation: "localstorage",
        });
    }

    async login(): Promise<void> {
        await this.auth0Client.loginWithRedirect();
    }

    async logout(): Promise<void> {
        await this.auth0Client.logout({
            returnTo: window.location.origin,
        });
    }
    async handleRedirectCallback(): Promise<void> {
        await this.auth0Client.handleRedirectCallback();
    }
    async checkUser(): Promise<boolean> {
        const isAuthenticated = await this.auth0Client.isAuthenticated();
        return isAuthenticated;
    }
    async getToken(): Promise<string> {
        const token = await this.auth0Client.getTokenSilently();
        return token;
    }
}
