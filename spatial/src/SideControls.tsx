// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useAtom } from "jotai";
import {
  ImageSrcAtom,
  ImageSentAtom,
  DrawModeAtom,
  IsUploadedImageAtom,
  BumpSessionAtom,
  IsAnnotatingAtom,
  DetectTypeAtom,
  BoundingBoxes2DAtom,
  AnnotatedImagesAtom,
} from "./atoms";
import { ScreenshareButton } from "./ScreenshareButton";
import { useResetState } from "./hooks";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadImage } from "./utils";

export function SideControls() {
  const [imageSrc, setImageSrc] = useAtom(ImageSrcAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [isAnnotating, setIsAnnotating] = useAtom(IsAnnotatingAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [annotatedImages, setAnnotatedImages] = useAtom(AnnotatedImagesAtom);
  const resetState = useResetState();

  // 执行标注的函数
  const performAnnotation = async (imageDataUrl: string) => {
    console.log("开始执行标注");
    try {
      // 准备图像数据
      console.log("准备图像数据");
      const maxSize = 640;
      const copyCanvas = document.createElement("canvas");
      const ctx = copyCanvas.getContext("2d")!;
      
      const image = await loadImage(imageDataUrl);
      const scale = Math.min(maxSize / image.width, maxSize / image.height);
      copyCanvas.width = image.width * scale;
      copyCanvas.height = image.height * scale;
      ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
      
      const processedDataURL = copyCanvas.toDataURL("image/png");
      
      // 构建提示词
      const prompt = `Detect 建筑物, with no more than 20 items. Output a json list where each entry contains the 2D bounding box in "box_2d" and a text label in "label".`;
      
      console.log("调用API");
      // 创建API客户端
      const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      
      // 发送请求
      let response = (await client
        .getGenerativeModel(
          {model: "models/gemini-1.5-flash"},
          {apiVersion: 'v1beta'}
        )
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {text: prompt},
                {inlineData: {
                  data: processedDataURL.replace("data:image/png;base64,", ""),
                  mimeType: "image/png"
                }}
              ]
            }
          ],
          generationConfig: {temperature: 0.5}
        })).response.text();
      
      console.log("处理响应");
      // 处理响应
      if (response.includes("```json")) {
        response = response.split("```json")[1].split("```")[0];
      }
      
      const parsedResponse = JSON.parse(response);
      const formattedBoxes = parsedResponse.map(
        (box: { box_2d: [number, number, number, number]; label: string }) => {
          const [ymin, xmin, ymax, xmax] = box.box_2d;
          return {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: box.label,
          };
        },
      );
      
      console.log("更新状态");
      // 更新状态
      setBoundingBoxes2D(formattedBoxes);
      
      // 保存标注图片
      const newAnnotatedImage = {
        id: Date.now().toString(),
        src: processedDataURL,
        timestamp: Date.now(),
        type: "2D bounding boxes" as const,
        annotations: formattedBoxes
      };
      
      setAnnotatedImages((prev) => [newAnnotatedImage, ...prev]);
      
      setImageSent(true);
      console.log("标注完成");
    } catch (error) {
      console.error("自动标注失败:", error);
    } finally {
      setIsAnnotating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className={`flex items-center button bg-[#3B68FF] px-12 !text-white !border-none ${isAnnotating ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          className="hidden"
          type="file"
          accept=".jpg, .jpeg, .png, .webp"
          disabled={isAnnotating}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // 先设置标注状态
              setIsAnnotating(true);
              
              const reader = new FileReader();
              reader.onload = async (e) => {
                try {
                  const imageDataUrl = e.target?.result as string;
                  
                  // 重置状态并设置新图像
                  resetState();
                  setImageSrc(imageDataUrl);
                  setIsUploadedImage(true);
                  setImageSent(false);
                  setBumpSession((prev) => prev + 1);
                  
                  // 确保图像已加载
                  const image = new Image();
                  image.src = imageDataUrl;
                  
                  await new Promise((resolve) => {
                    image.onload = resolve;
                  });
                  
                  // 直接使用读取到的图像数据进行标注
                  await performAnnotation(imageDataUrl);
                } catch (error) {
                  console.error("处理图像失败:", error);
                  setIsAnnotating(false);
                }
              };
              
              reader.onerror = () => {
                console.error("读取文件失败");
                setIsAnnotating(false);
              };
              
              reader.readAsDataURL(file);
            }
          }}
        />
        <div>{isAnnotating ? "自动标注中..." : "Upload an image"}</div>
      </label>
      <div className="hidden">
        <button
          className="button flex gap-3 justify-center items-center"
          onClick={() => {
            setDrawMode(!drawMode);
          }}
        >
          <div className="text-lg"> 🎨</div>
          <div>Draw on image</div>
        </button>
        <ScreenshareButton />
      </div>
    </div>
  );
}
