import { useState } from "react";
import useShowToast from "./useShowToast";

const usePreviewImg = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const showToast = useShowToast();
  const maxFileSizeInBytes = 2 * 1024 * 1024;
  const maxWidth = 1080;
  const maxHeight = 1080;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      // if (file.size > maxFileSizeInBytes) {
      //   showToast("Error", "File size must be less than 2MB", "error");
      //   setSelectedFile(null);
      //   return;
      // }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height *= maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width *= maxHeight / height));
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob.size > maxFileSizeInBytes) {
                showToast(
                  "Error",
                  "Compressed image is larger than 2MB",
                  "error"
                );
                setSelectedFile(null);
              } else {
                const compressedReader = new FileReader();
                compressedReader.readAsDataURL(blob);
                compressedReader.onloadend = () => {
                  setSelectedFile(compressedReader.result);
                };
              }
            },
            "image/jpeg",
            0.7
          );
        };
      };

      reader.readAsDataURL(file);
    } else {
      showToast("Error", "Please select an image file", "error");
      setSelectedFile(null);
    }
  };

  return { selectedFile, handleImageChange, setSelectedFile };
};

export default usePreviewImg;
