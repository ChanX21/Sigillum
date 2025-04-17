export async function authenticateImage(imageFile: File) {
    const formData = new FormData()
    formData.append("image", imageFile, imageFile.name)



    console.log("Has image?", formData.has("image"));
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}verify`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });
        
        // Always try to parse the response as JSON
        const data = await response.json();

        if (!response.ok) {
            // Handle non-OK response but using the parsed data
            throw new Error(data.message || "Verification failed");
        }

        return data;
    } catch (error: any) {
        throw new Error(`${error?.message}`);
    }
}