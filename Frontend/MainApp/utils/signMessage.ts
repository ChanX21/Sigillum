const signAuthMessage = async (nonce: string, signMessage: any) => {
    const message = `Sign this message to authenticate: ${nonce}`;

    const { signature } = await signMessage({
        message: new TextEncoder().encode(message)
    });

    return { message, signature };
};
