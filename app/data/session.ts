const key = "logic2010.username";

export function signedIn(): boolean {
    return sessionStorage.getItem(key) !== null;
}

/** Any username is accepted. An empty name still counts as signed in. */
export function signIn(username: string): void {
    sessionStorage.setItem(key, username);
}

export function signOut(): void {
    sessionStorage.removeItem(key);
}
