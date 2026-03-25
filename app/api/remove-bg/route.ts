import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = image.split(",")[1];
    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "Invalid image format" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Check file size (5MB max)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image too large (max 5MB)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key not configured" },
        { status: 500 }
      );
    }

    // Call remove.bg API
    const formData = new FormData();
    formData.append(
      "image_file",
      new Blob([imageBuffer], { type: "image/png" }),
      "image.png"
    );
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.title || "Failed to remove background");
    }

    // Get the result image
    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString("base64");
    const resultImage = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({
      success: true,
      image: resultImage,
      format: "png",
    });
  } catch (error) {
    console.error("Error removing background:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process image",
      },
      { status: 500 }
    );
  }
}
