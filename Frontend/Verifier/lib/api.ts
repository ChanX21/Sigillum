export async function authenticateImage(userAddress: string, imageFile: File) {
    const formData = new FormData()
    formData.append("image", imageFile)

    try {
        const response = await fetch(`https://sui-be.vercel.app/authenticate/${userAddress}`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text(); // get error body (optional)
            throw new Error(`API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Authentication Error:', error?.message);
        throw new Error(`Failed to authenticate user: ${error?.message}`);
    }
}