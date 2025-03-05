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
  AnnotatedImagesAtom, 
  ImageSrcAtom, 
  IsUploadedImageAtom, 
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  PointsAtom,
  DetectTypeAtom,
  ImageSentAtom
} from "./atoms";
import { useResetState } from "./hooks";

export function AnnotatedImages() {
  const [annotatedImages, setAnnotatedImages] = useAtom(AnnotatedImagesAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setDetectType] = useAtom(DetectTypeAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  
  // 删除图片的处理函数
  const handleDeleteImage = (e: React.MouseEvent, imageId: string) => {
    console.log(`[删除图片] 尝试删除图片, ID: ${imageId}`);
    
    // 阻止事件冒泡，避免触发图片点击事件
    e.stopPropagation();
    console.log("[删除图片] 阻止事件冒泡");
    
    // 弹出确认对话框
    console.log("[删除图片] 显示确认对话框");
    if (window.confirm("确定要删除这张图片吗？")) {
      console.log("[删除图片] 用户确认删除");
      
      // 用户确认后，从标注图片列表中删除指定图片
      setAnnotatedImages((prev) => {
        const targetImage = prev.find(img => img.id === imageId);
        console.log(`[删除图片] 查找目标图片: ${targetImage ? '找到' : '未找到'}`);
        
        if (targetImage) {
          console.log(`[删除图片] 删除图片信息 - ID: ${targetImage.id}, 时间戳: ${new Date(targetImage.timestamp).toLocaleString()}, 类型: ${targetImage.type}`);
        }
        
        const newList = prev.filter((img) => img.id !== imageId);
        console.log(`[删除图片] 更新标注图片列表，原长度: ${prev.length}, 新长度: ${newList.length}`);
        return newList;
      });
      
      console.log("[删除图片] 删除操作完成");
    } else {
      console.log("[删除图片] 用户取消删除");
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-150px)] overflow-y-auto">
      <div className="uppercase mb-2 font-medium">已标注图片</div>
      {annotatedImages.length === 0 ? (
        <div className="text-gray-500 text-sm">暂无已标注图片</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {annotatedImages.map((image) => (
            <button
              key={image.id}
              className="p-0 w-[110px] h-[110px] relative overflow-hidden"
              onClick={() => {
                console.log(`[选择图片] 用户点击图片, ID: ${image.id}, 时间戳: ${new Date(image.timestamp).toLocaleString()}`);
                
                console.log("[选择图片] 设置为非上传图像模式");
                setIsUploadedImage(false);
                console.log("[选择图片] 设置图像源");
                setImageSrc(image.src);
                
                // 恢复标注结果
                console.log(`[选择图片] 设置标注类型: ${image.type}`);
                setDetectType(image.type);
                
                // 根据标注类型恢复不同的标注数据
                if (image.type === "2D bounding boxes") {
                  console.log(`[选择图片] 恢复2D边界框数据, 数量: ${image.annotations.length}`);
                  setBoundingBoxes2D(image.annotations as any);
                  setBoundingBoxes3D([]);
                  setPoints([]);
                } else if (image.type === "3D bounding boxes") {
                  console.log(`[选择图片] 恢复3D边界框数据, 数量: ${image.annotations.length}`);
                  setBoundingBoxes3D(image.annotations as any);
                  setBoundingBoxes2D([]);
                  setPoints([]);
                } else if (image.type === "Points") {
                  console.log(`[选择图片] 恢复点标注数据, 数量: ${image.annotations.length}`);
                  setPoints(image.annotations as any);
                  setBoundingBoxes2D([]);
                  setBoundingBoxes3D([]);
                }
                
                // 设置图片已标注状态，防止重新标注
                console.log("[选择图片] 设置图像已标注状态");
                setImageSent(true);
                console.log("[选择图片] 图像选择完成");
              }}
            >
              <img
                src={image.src}
                alt={`Annotated image ${image.id}`}
                className="absolute left-0 top-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                {new Date(image.timestamp).toLocaleString()}
              </div>
              <button
                className="absolute bottom-1 right-1 z-10 w-6 h-6 p-0 border-0 bg-transparent"
                onClick={(e) => handleDeleteImage(e, image.id)}
                title="删除图片"
              >
                <img 
                  src="icons/trash.jpg" 
                  alt="删除" 
                  className="w-6 h-6"
                />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
