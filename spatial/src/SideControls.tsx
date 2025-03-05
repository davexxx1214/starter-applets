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
    console.log("[自动标注] 开始执行标注流程");
    try {
      // 准备图像数据
      console.log("[自动标注] 开始准备图像数据");
      const maxSize = 640;
      const copyCanvas = document.createElement("canvas");
      const ctx = copyCanvas.getContext("2d")!;
      
      console.log("[自动标注] 加载图像");
      const image = await loadImage(imageDataUrl);
      console.log("[自动标注] 图像加载完成，原始尺寸:", image.width, "x", image.height);
      
      const scale = Math.min(maxSize / image.width, maxSize / image.height);
      copyCanvas.width = image.width * scale;
      copyCanvas.height = image.height * scale;
      console.log("[自动标注] 调整图像尺寸为:", copyCanvas.width, "x", copyCanvas.height, "缩放比例:", scale);
      
      ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
      console.log("[自动标注] 图像绘制到Canvas完成");
      
      const processedDataURL = copyCanvas.toDataURL("image/png");
      console.log("[自动标注] 图像转换为DataURL完成");
      
      // 构建提示词
      const prompt = `Detect only 建筑物 in the image, ignoring reflections in water, shadows, or other non-building elements. Focus on the main structures and architectural elements. Limit to no more than 10 clear buildings. Output a json list where each entry contains the 2D bounding box in "box_2d" and a text label in "label".`;
      console.log("[自动标注] 提示词准备完成");
      
      console.log("[自动标注] 开始调用Gemini API");
      // 创建API客户端
      const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      console.log("[自动标注] API客户端创建完成");
      
      // 发送请求
      console.log("[自动标注] 发送图像识别请求");
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
      
      console.log("[自动标注] 收到API响应");
      // 处理响应
      if (response.includes("```json")) {
        console.log("[自动标注] 响应包含JSON代码块，提取JSON内容");
        response = response.split("```json")[1].split("```")[0];
      }
      
      console.log("[自动标注] 解析JSON响应");
      const parsedResponse = JSON.parse(response);
      console.log(`[自动标注] 检测到 ${parsedResponse.length} 个建筑物`);
      
      const formattedBoxes = parsedResponse.map(
        (box: { box_2d: [number, number, number, number]; label: string }, index: number) => {
          const [ymin, xmin, ymax, xmax] = box.box_2d;
          console.log(`[自动标注] 处理第 ${index+1} 个建筑物: ${box.label}, 坐标: [${xmin/1000}, ${ymin/1000}, ${xmax/1000}, ${ymax/1000}]`);
          return {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: box.label,
          };
        },
      );
      
      console.log("[自动标注] 开始更新应用状态");
      // 更新状态
      console.log("[自动标注] 设置边界框数据");
      setBoundingBoxes2D(formattedBoxes);
      
      // 保存标注图片
      const imageId = Date.now().toString();
      const timestamp = Date.now();
      console.log(`[自动标注] 创建新的标注图片记录, ID: ${imageId}, 时间戳: ${new Date(timestamp).toLocaleString()}`);
      
      const newAnnotatedImage = {
        id: imageId,
        src: processedDataURL,
        timestamp: timestamp,
        type: "2D bounding boxes" as const,
        annotations: formattedBoxes
      };
      
      console.log("[自动标注] 保存标注图片到列表");
      setAnnotatedImages((prev) => {
        console.log(`[自动标注] 更新标注图片列表，当前列表长度: ${prev.length}, 新长度: ${prev.length + 1}`);
        return [newAnnotatedImage, ...prev];
      });
      
      console.log("[自动标注] 设置图像已发送状态");
      setImageSent(true);
      console.log("[自动标注] 标注流程完成");
    } catch (error) {
      console.error("[自动标注] 标注过程失败:", error);
    } finally {
      console.log("[自动标注] 重置标注状态为完成");
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
              console.log(`[上传图片] 开始处理文件: ${file.name}, 大小: ${(file.size / 1024).toFixed(2)}KB, 类型: ${file.type}`);
              
              // 先设置标注状态
              setIsAnnotating(true);
              console.log("[上传图片] 设置标注状态为进行中");
              
              const reader = new FileReader();
              reader.onload = async (e) => {
                try {
                  console.log("[上传图片] 文件读取完成，准备处理图像数据");
                  const imageDataUrl = e.target?.result as string;
                  
                  // 重置状态并设置新图像
                  console.log("[上传图片] 重置应用状态");
                  resetState();
                  console.log("[上传图片] 设置图像源");
                  setImageSrc(imageDataUrl);
                  console.log("[上传图片] 标记为上传图像");
                  setIsUploadedImage(true);
                  console.log("[上传图片] 重置图像发送状态");
                  setImageSent(false);
                  console.log("[上传图片] 更新会话ID");
                  setBumpSession((prev) => prev + 1);
                  
                  // 确保图像已加载
                  console.log("[上传图片] 等待图像完全加载");
                  const image = new Image();
                  image.src = imageDataUrl;
                  
                  await new Promise((resolve) => {
                    image.onload = resolve;
                  });
                  
                  console.log("[上传图片] 图像加载完成，尺寸:", image.width, "x", image.height);
                  console.log("[上传图片] 开始执行自动标注");
                  
                  // 直接使用读取到的图像数据进行标注
                  await performAnnotation(imageDataUrl);
                } catch (error) {
                  console.error("[上传图片] 处理图像失败:", error);
                  setIsAnnotating(false);
                }
              };
              
              reader.onerror = () => {
                console.error("[上传图片] 读取文件失败");
                setIsAnnotating(false);
              };
              
              console.log("[上传图片] 开始读取文件数据");
              reader.readAsDataURL(file);
            }
          }}
        />
        <div>{isAnnotating ? "自动标注中..." : "上传图片"}</div>
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
