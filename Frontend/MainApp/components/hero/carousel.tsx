import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ImageSlider = () => {
  const [positionIndexes, setPositionIndexes] = useState([0, 1, 2, 3, 4]);

  const city1 = "/image1.jpg";
  const city2 = "/image2.jpg";
  const city3 = "/image3.jpg";
  const planet1 = "/image4.jpg";
  const planet2 = "/image5.jpg";

  const images = [city1, city2, city3, planet1, planet2];
  const positions = ["center", "left1", "left", "right", "right1"];

  const imageVariants = {
    center: { x: "0%", scale: 1, zIndex: 5 },
    left1: { x: "-50%", scale: 0.7, zIndex: 3 },
    left: { x: "-90%", scale: 0.5, zIndex: 2 },
    right: { x: "90%", scale: 0.5, zIndex: 1 },
    right1: { x: "50%", scale: 0.7, zIndex: 3 },
  };

  const handleNext = () => {
    setPositionIndexes((prevIndexes) =>
      prevIndexes.map((prevIndex) => (prevIndex + 1) % 5)
    );
  };

  useEffect(() => {
    const interval = setInterval(handleNext, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center flex-col justify-center relative my-8 sm:my-12 md:my-16 lg:my-20 h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden">
      {images.map((image, index) => (
        <motion.img
          key={index}
          src={image}
          alt="carousel image"
          className="rounded-[12px] absolute h-[200px] w-[200px] md:h-[300px] md:w-[300px] lg:h-[400px] lg:w-[400px] object-cover"
          initial="center"
          animate={positions[positionIndexes[index]]}
          variants={imageVariants}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
};

export default ImageSlider;
