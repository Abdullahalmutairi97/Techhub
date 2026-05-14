CREATE DATABASE IF NOT EXISTS pcparts_db;
USE pcparts_db;

CREATE TABLE IF NOT EXISTS Users (
  idU INT AUTO_INCREMENT PRIMARY KEY,
  uName VARCHAR(50) NOT NULL UNIQUE,
  uPass VARCHAR(255) NOT NULL,
  firstName VARCHAR(50),
  lastName VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  resetToken VARCHAR(255),
  resetExpires BIGINT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Products (
  idP INT AUTO_INCREMENT PRIMARY KEY,
  labelP VARCHAR(100) NOT NULL,
  desP TEXT,
  priceP DECIMAL(10,2) NOT NULL,
  QtyP INT NOT NULL DEFAULT 0,
  photoPath VARCHAR(255) DEFAULT '/images/products/default.jpg',
  category VARCHAR(50),
  brand VARCHAR(50),
  specs TEXT,
  isAvailable BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ShopCart (
  idCart INT AUTO_INCREMENT PRIMARY KEY,
  idU INT NOT NULL,
  idP INT NOT NULL,
  quantity INT DEFAULT 1,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idU) REFERENCES Users(idU) ON DELETE CASCADE,
  FOREIGN KEY (idP) REFERENCES Products(idP) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (idU, idP)
);

CREATE TABLE IF NOT EXISTS Orders (
  idO INT AUTO_INCREMENT PRIMARY KEY,
  idU INT NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  shippingAddress TEXT NOT NULL,
  orderStatus ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
  paymentId VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idU) REFERENCES Users(idU)
);

CREATE TABLE IF NOT EXISTS Wishlist (
  idW INT AUTO_INCREMENT PRIMARY KEY,
  idU INT NOT NULL,
  idP INT NOT NULL,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idU) REFERENCES Users(idU) ON DELETE CASCADE,
  FOREIGN KEY (idP) REFERENCES Products(idP) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist_item (idU, idP)
);

CREATE TABLE IF NOT EXISTS OrderItems (
  idOI INT AUTO_INCREMENT PRIMARY KEY,
  idO INT NOT NULL,
  idP INT NOT NULL,
  quantity INT NOT NULL,
  priceAtTime DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idO) REFERENCES Orders(idO) ON DELETE CASCADE,
  FOREIGN KEY (idP) REFERENCES Products(idP)
);

-- CPU (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Intel Core i9-14900K', 'Top-tier desktop processor with 24 cores for extreme performance gaming and content creation.', 589.99, 45, '/images/products/cpu.jpg', 'CPU', 'Intel', '24 Cores,32 Threads,6.0GHz Boost,253W TDP,LGA1700,DDR5 Support'),
('Intel Core i7-14700K', 'High-performance 20-core processor ideal for gaming and multitasking workloads.', 409.99, 60, '/images/products/cpu.jpg', 'CPU', 'Intel', '20 Cores,28 Threads,5.6GHz Boost,125W TDP,LGA1700,DDR5 Support'),
('Intel Core i5-14600K', 'Mid-range powerhouse offering excellent gaming performance at a competitive price.', 319.99, 80, '/images/products/cpu.jpg', 'CPU', 'Intel', '14 Cores,20 Threads,5.3GHz Boost,125W TDP,LGA1700,DDR5 Support'),
('Intel Core i5-14400F', 'Budget-friendly CPU with solid gaming performance, no integrated graphics.', 179.99, 100, '/images/products/cpu.jpg', 'CPU', 'Intel', '10 Cores,16 Threads,4.7GHz Boost,65W TDP,LGA1700,DDR4 Support'),
('Intel Core i3-14100', 'Entry-level quad-core processor for everyday computing tasks and light gaming.', 129.99, 90, '/images/products/cpu.jpg', 'CPU', 'Intel', '4 Cores,8 Threads,4.7GHz Boost,60W TDP,LGA1700,DDR5 Support'),
('AMD Ryzen 9 7950X', 'Flagship 16-core processor for professionals demanding ultimate multithreaded performance.', 699.99, 30, '/images/products/cpu.jpg', 'CPU', 'AMD', '16 Cores,32 Threads,5.7GHz Boost,170W TDP,AM5,DDR5 Support'),
('AMD Ryzen 9 7900X', 'Twelve-core AMD powerhouse delivering exceptional performance for creators and gamers.', 449.99, 50, '/images/products/cpu.jpg', 'CPU', 'AMD', '12 Cores,24 Threads,5.6GHz Boost,170W TDP,AM5,DDR5 Support'),
('AMD Ryzen 7 7700X', 'Eight-core processor with high boost clocks, perfect for gaming and streaming simultaneously.', 299.99, 75, '/images/products/cpu.jpg', 'CPU', 'AMD', '8 Cores,16 Threads,5.4GHz Boost,105W TDP,AM5,DDR5 Support'),
('AMD Ryzen 5 7600X', 'Six-core AMD processor offering impressive gaming performance for mainstream builds.', 229.99, 95, '/images/products/cpu.jpg', 'CPU', 'AMD', '6 Cores,12 Threads,5.3GHz Boost,105W TDP,AM5,DDR5 Support'),
('AMD Ryzen 5 7600', 'Efficient six-core processor with lower TDP, great for budget AM5 platform builds.', 199.99, 110, '/images/products/cpu.jpg', 'CPU', 'AMD', '6 Cores,12 Threads,5.1GHz Boost,65W TDP,AM5,DDR5 Support'),
('Intel Core i9-13900KS', 'Special edition CPU reaching 6.0GHz out of the box, ultimate single-core performance.', 549.99, 20, '/images/products/cpu.jpg', 'CPU', 'Intel', '24 Cores,32 Threads,6.0GHz Boost,253W TDP,LGA1700,DDR5 Support'),
('AMD Ryzen 9 7950X3D', 'World fastest gaming CPU featuring 3D V-Cache technology for unparalleled game performance.', 699.99, 25, '/images/products/cpu.jpg', 'CPU', 'AMD', '16 Cores,32 Threads,5.7GHz Boost,120W TDP,AM5,3D V-Cache'),
('AMD Ryzen 7 7800X3D', 'The ultimate gaming CPU with 3D V-Cache, delivering record-breaking gaming framerates.', 449.99, 40, '/images/products/cpu.jpg', 'CPU', 'AMD', '8 Cores,16 Threads,5.0GHz Boost,120W TDP,AM5,3D V-Cache'),
('Intel Core i5-13600K', 'Previous-gen best value CPU still delivering outstanding gaming and productivity performance.', 269.99, 85, '/images/products/cpu.jpg', 'CPU', 'Intel', '14 Cores,20 Threads,5.1GHz Boost,125W TDP,LGA1700,DDR5 Support'),
('AMD Ryzen 5 5600X', 'Proven AM4 platform processor with excellent game performance and wide compatibility.', 149.99, 120, '/images/products/cpu.jpg', 'CPU', 'AMD', '6 Cores,12 Threads,4.6GHz Boost,65W TDP,AM4,DDR4 Support'),
('AMD Ryzen 7 5700X', 'Eight-core AM4 CPU offering great value for budget to mid-range system builders.', 169.99, 100, '/images/products/cpu.jpg', 'CPU', 'AMD', '8 Cores,16 Threads,4.6GHz Boost,65W TDP,AM4,DDR4 Support'),
('Intel Core i7-13700K', 'Sixteen-core Intel processor combining efficiency and performance cores for versatile workloads.', 379.99, 55, '/images/products/cpu.jpg', 'CPU', 'Intel', '16 Cores,24 Threads,5.4GHz Boost,125W TDP,LGA1700,DDR5 Support'),
('AMD Ryzen 3 4100', 'Entry-level quad-core AMD processor for budget builds and basic computing tasks.', 89.99, 150, '/images/products/cpu.jpg', 'CPU', 'AMD', '4 Cores,8 Threads,4.0GHz Boost,65W TDP,AM4,DDR4 Support'),
('Intel Core i9-14900KF', 'No integrated graphics version of the flagship i9, ideal for dedicated GPU builds.', 559.99, 35, '/images/products/cpu.jpg', 'CPU', 'Intel', '24 Cores,32 Threads,6.0GHz Boost,253W TDP,LGA1700,No iGPU'),
('AMD Ryzen 9 5900X', 'Twelve-core AM4 powerhouse, still competitive for content creators and heavy workloads.', 249.99, 60, '/images/products/cpu.jpg', 'CPU', 'AMD', '12 Cores,24 Threads,4.8GHz Boost,105W TDP,AM4,DDR4 Support'),
('Intel Core i5-12400F', 'Value-oriented six-core CPU with consistent gaming performance for budget builders.', 139.99, 130, '/images/products/cpu.jpg', 'CPU', 'Intel', '6 Cores,12 Threads,4.4GHz Boost,65W TDP,LGA1700,No iGPU'),
('AMD Ryzen 5 5500', 'Budget AM4 hex-core processor providing solid everyday computing and casual gaming.', 99.99, 140, '/images/products/cpu.jpg', 'CPU', 'AMD', '6 Cores,12 Threads,4.2GHz Boost,65W TDP,AM4,DDR4 Support');

-- Motherboard (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('ASUS ROG Maximus Z790 Hero', 'Premium Z790 ATX board with extensive overclocking features and top-tier VRM.', 629.99, 20, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('ASUS ROG Strix Z790-E Gaming', 'High-end gaming motherboard with robust power delivery and comprehensive connectivity.', 499.99, 30, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,ATX,5x M.2,WiFi 6E,2.5G LAN'),
('MSI MEG Z790 ACE', 'Flagship MSI board featuring extreme overclocking support and premium build quality.', 579.99, 18, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,E-ATX,5x M.2,WiFi 6E,10G LAN'),
('Gigabyte Z790 AORUS Master', 'Feature-packed AORUS motherboard with DDR5 support and advanced thermal design.', 499.99, 25, '/images/products/motherboard.jpg', 'Motherboard', 'Gigabyte', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('MSI MAG Z790 Tomahawk WiFi', 'Balanced Z790 board offering great value with solid feature set for mainstream builders.', 289.99, 50, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6,2.5G LAN'),
('ASUS PRIME Z790-P WiFi', 'Reliable entry-level Z790 motherboard for budget-conscious LGA1700 platform builders.', 219.99, 65, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'Z790 Chipset,LGA1700,DDR5,PCIe 5.0,ATX,3x M.2,WiFi 6,2.5G LAN'),
('ASRock B760M Pro RS', 'Micro-ATX B760 board providing essential features for compact mainstream Intel builds.', 129.99, 80, '/images/products/motherboard.jpg', 'Motherboard', 'ASRock', 'B760 Chipset,LGA1700,DDR5,PCIe 4.0,mATX,2x M.2,No WiFi,2.5G LAN'),
('ASUS TUF Gaming X670E-Plus WiFi', 'Durable AM5 motherboard with military-grade components and full PCIe 5.0 support.', 299.99, 45, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'X670E Chipset,AM5,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('MSI MEG X670E ACE', 'Top-tier X670E board for AMD AM5 with extreme VRM and comprehensive connectivity.', 649.99, 15, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'X670E Chipset,AM5,DDR5,PCIe 5.0,E-ATX,5x M.2,WiFi 6E,10G LAN'),
('Gigabyte X670E AORUS Master', 'Feature-rich AORUS X670E board with superior power delivery for Ryzen 7000 CPUs.', 499.99, 22, '/images/products/motherboard.jpg', 'Motherboard', 'Gigabyte', 'X670E Chipset,AM5,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('ASRock X670E Taichi', 'Premium ASRock board with extensive overclocking features and robust power stages.', 449.99, 28, '/images/products/motherboard.jpg', 'Motherboard', 'ASRock', 'X670E Chipset,AM5,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('MSI MAG B650 Tomahawk WiFi', 'Balanced B650 AM5 motherboard, great choice for Ryzen 7000 mid-range builds.', 219.99, 60, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'B650 Chipset,AM5,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6,2.5G LAN'),
('ASUS ROG Crosshair X670E Hero', 'ROG flagship X670E board optimized for maximum AMD Ryzen 7000 overclocking potential.', 599.99, 18, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'X670E Chipset,AM5,DDR5,PCIe 5.0,ATX,5x M.2,WiFi 6E,2.5G LAN'),
('Gigabyte B650 AORUS Elite AX', 'Value-packed B650 board with PCIe 5.0 support and excellent connectivity options.', 199.99, 70, '/images/products/motherboard.jpg', 'Motherboard', 'Gigabyte', 'B650 Chipset,AM5,DDR5,PCIe 5.0,ATX,4x M.2,WiFi 6E,2.5G LAN'),
('ASUS PRIME B650-Plus', 'Budget-friendly B650 AM5 board covering all basics for entry-level Ryzen 7000 builds.', 149.99, 85, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'B650 Chipset,AM5,DDR5,PCIe 4.0,ATX,2x M.2,No WiFi,1G LAN'),
('MSI PRO B760M-A WiFi DDR4', 'Affordable B760 micro-ATX board with DDR4 support for cost-effective Intel builds.', 119.99, 90, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'B760 Chipset,LGA1700,DDR4,PCIe 4.0,mATX,2x M.2,WiFi 5,2.5G LAN'),
('ASRock B550 Extreme4', 'Proven B550 AM4 board with PCIe 4.0 and solid power delivery for Ryzen 5000.', 149.99, 75, '/images/products/motherboard.jpg', 'Motherboard', 'ASRock', 'B550 Chipset,AM4,DDR4,PCIe 4.0,ATX,3x M.2,No WiFi,2.5G LAN'),
('Gigabyte B550 AORUS Pro AX', 'Feature-rich B550 board with WiFi, excellent VRM, and PCIe 4.0 for AM4 builders.', 179.99, 65, '/images/products/motherboard.jpg', 'Motherboard', 'Gigabyte', 'B550 Chipset,AM4,DDR4,PCIe 4.0,ATX,3x M.2,WiFi 6,2.5G LAN'),
('ASUS ROG Strix B550-F Gaming WiFi', 'Gaming-focused B550 board with premium audio, WiFi 6, and robust connectivity.', 199.99, 55, '/images/products/motherboard.jpg', 'Motherboard', 'ASUS', 'B550 Chipset,AM4,DDR4,PCIe 4.0,ATX,3x M.2,WiFi 6,2.5G LAN'),
('MSI MAG B550 Tomahawk', 'Popular B550 AM4 board known for excellent thermal performance and solid build quality.', 169.99, 70, '/images/products/motherboard.jpg', 'Motherboard', 'MSI', 'B550 Chipset,AM4,DDR4,PCIe 4.0,ATX,2x M.2,No WiFi,2.5G LAN'),
('Gigabyte H610M S2H DDR4', 'Entry-level LGA1700 micro-ATX board for basic Intel builds on a tight budget.', 79.99, 120, '/images/products/motherboard.jpg', 'Motherboard', 'Gigabyte', 'H610 Chipset,LGA1700,DDR4,PCIe 4.0,mATX,1x M.2,No WiFi,1G LAN'),
('ASRock A520M Pro4', 'Budget AM4 micro-ATX board supporting Ryzen 3000/5000 for affordable AMD builds.', 89.99, 100, '/images/products/motherboard.jpg', 'Motherboard', 'ASRock', 'A520 Chipset,AM4,DDR4,PCIe 3.0,mATX,1x M.2,No WiFi,1G LAN');

-- RAM (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Corsair Dominator Platinum RGB 32GB DDR5', 'Premium DDR5 kit with tight timings and RGB, built for enthusiast builds.', 189.99, 50, '/images/products/ram.jpg', 'RAM', 'Corsair', '32GB (2x16GB),DDR5-6000,CL30,1.35V,RGB,XMP 3.0'),
('Corsair Vengeance DDR5 32GB', 'High-speed DDR5 memory with reliable performance across Z790/X670E boards.', 139.99, 75, '/images/products/ram.jpg', 'RAM', 'Corsair', '32GB (2x16GB),DDR5-5600,CL36,1.25V,No RGB,XMP 3.0'),
('Corsair Vengeance LPX 16GB DDR4', 'Best-selling low-profile DDR4 kit compatible with virtually any platform.', 49.99, 200, '/images/products/ram.jpg', 'RAM', 'Corsair', '16GB (2x8GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('Corsair Vengeance LPX 32GB DDR4', 'Expanded 32GB DDR4 kit for multitaskers and content creators needing more headroom.', 79.99, 150, '/images/products/ram.jpg', 'RAM', 'Corsair', '32GB (2x16GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('G.Skill Trident Z5 RGB 32GB DDR5', 'Stunning RGB DDR5 kit with high-speed performance for enthusiast gaming.', 179.99, 60, '/images/products/ram.jpg', 'RAM', 'G.Skill', '32GB (2x16GB),DDR5-6000,CL36,1.35V,RGB,XMP 3.0'),
('G.Skill Trident Z5 Neo 32GB DDR5', 'AMD EXPO optimized DDR5 kit perfectly tuned for Ryzen 7000 platform performance.', 169.99, 65, '/images/products/ram.jpg', 'RAM', 'G.Skill', '32GB (2x16GB),DDR5-6000,CL30,1.35V,RGB,AMD EXPO'),
('G.Skill Ripjaws V 16GB DDR4', 'Classic DDR4 performance kit with low-profile heatspreader and solid compatibility.', 44.99, 180, '/images/products/ram.jpg', 'RAM', 'G.Skill', '16GB (2x8GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('G.Skill Ripjaws V 32GB DDR4', 'Expanded DDR4 kit for demanding workloads at reasonable cost.', 74.99, 140, '/images/products/ram.jpg', 'RAM', 'G.Skill', '32GB (2x16GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('Kingston Fury Beast DDR5 32GB', 'Aggressive DDR5 kit with Intel XMP 3.0 and AMD EXPO support for broad compatibility.', 149.99, 70, '/images/products/ram.jpg', 'RAM', 'Kingston', '32GB (2x16GB),DDR5-5600,CL40,1.25V,No RGB,XMP 3.0 & EXPO'),
('Kingston Fury Beast DDR4 16GB', 'Reliable DDR4 kit with plug-and-play compatibility and solid everyday performance.', 47.99, 190, '/images/products/ram.jpg', 'RAM', 'Kingston', '16GB (2x8GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('Corsair Dominator Platinum RGB 64GB DDR5', 'Massive 64GB DDR5 kit for professional workstations requiring maximum memory capacity.', 349.99, 25, '/images/products/ram.jpg', 'RAM', 'Corsair', '64GB (2x32GB),DDR5-6000,CL30,1.35V,RGB,XMP 3.0'),
('G.Skill Trident Z5 RGB 64GB DDR5', 'High-capacity DDR5 kit ideal for 3D rendering and video editing workstations.', 329.99, 30, '/images/products/ram.jpg', 'RAM', 'G.Skill', '64GB (2x32GB),DDR5-6400,CL32,1.40V,RGB,XMP 3.0'),
('Crucial Pro DDR5 32GB', 'Reliable mainstream DDR5 offering solid performance at a competitive price point.', 129.99, 85, '/images/products/ram.jpg', 'RAM', 'Crucial', '32GB (2x16GB),DDR5-5600,CL46,1.10V,No RGB,XMP 3.0'),
('Crucial Ballistix 16GB DDR4', 'Performance DDR4 kit designed for gamers with overclocking potential built in.', 54.99, 160, '/images/products/ram.jpg', 'RAM', 'Crucial', '16GB (2x8GB),DDR4-3600,CL16,1.35V,RGB,XMP 2.0'),
('Team T-Force Delta RGB 32GB DDR4', 'Visually striking RGB DDR4 kit with good overclocking headroom for gaming builds.', 84.99, 110, '/images/products/ram.jpg', 'RAM', 'Team Group', '32GB (2x16GB),DDR4-3600,CL18,1.35V,RGB,XMP 2.0'),
('Kingston Fury Renegade 32GB DDR5', 'Performance-tuned DDR5 kit with aggressive timings for overclocking enthusiasts.', 189.99, 45, '/images/products/ram.jpg', 'RAM', 'Kingston', '32GB (2x16GB),DDR5-6400,CL32,1.40V,RGB,XMP 3.0'),
('Corsair Vengeance RGB Pro 32GB DDR4', 'Iconic RGB DDR4 kit with customizable lighting and iCUE software integration.', 89.99, 120, '/images/products/ram.jpg', 'RAM', 'Corsair', '32GB (2x16GB),DDR4-3600,CL18,1.35V,RGB,XMP 2.0'),
('G.Skill Flare X5 32GB DDR5', 'AMD EXPO tuned DDR5 offering low latency specifically for Ryzen 7000.', 159.99, 55, '/images/products/ram.jpg', 'RAM', 'G.Skill', '32GB (2x16GB),DDR5-6000,CL32,1.35V,No RGB,AMD EXPO'),
('Patriot Viper Steel 16GB DDR4', 'Budget-friendly DDR4 performance kit with solid XMP support and clean aesthetics.', 42.99, 170, '/images/products/ram.jpg', 'RAM', 'Patriot', '16GB (2x8GB),DDR4-3200,CL16,1.35V,No RGB,XMP 2.0'),
('Corsair Vengeance DDR5 64GB', 'High-capacity DDR5 kit for workstation builders needing maximum memory bandwidth.', 259.99, 35, '/images/products/ram.jpg', 'RAM', 'Corsair', '64GB (2x32GB),DDR5-5600,CL40,1.25V,No RGB,XMP 3.0'),
('Crucial Pro DDR4 16GB', 'Dependable DDR4 memory from Crucial offering consistent performance for everyday use.', 39.99, 200, '/images/products/ram.jpg', 'RAM', 'Crucial', '16GB (2x8GB),DDR4-3200,CL22,1.20V,No RGB,XMP 2.0'),
('G.Skill Ripjaws S5 32GB DDR5', 'Low-profile DDR5 kit perfect for builds requiring cooler clearance.', 139.99, 80, '/images/products/ram.jpg', 'RAM', 'G.Skill', '32GB (2x16GB),DDR5-5600,CL36,1.25V,No RGB,XMP 3.0');

-- GPU (25 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('NVIDIA GeForce RTX 4090 24GB', 'Fastest consumer GPU available, capable of 4K 144Hz gaming and AI-accelerated workflows.', 1599.99, 15, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '24GB GDDR6X,Ada Lovelace,16384 CUDA Cores,450W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4080 Super 16GB', 'High-end Ada Lovelace GPU delivering exceptional 4K gaming with ray tracing.', 999.99, 25, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '16GB GDDR6X,Ada Lovelace,10240 CUDA Cores,320W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4080 16GB', 'Top-tier GPU for 4K gaming and professional visualization with DLSS 3 Frame Generation.', 1199.99, 20, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '16GB GDDR6X,Ada Lovelace,9728 CUDA Cores,320W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4070 Ti Super 16GB', 'Excellent 1440p and 4K GPU with expanded memory bus and DLSS 3 support.', 799.99, 35, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '16GB GDDR6X,Ada Lovelace,8448 CUDA Cores,285W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4070 Super 12GB', 'Best mid-range GPU for 1440p gaming, significant performance gains over 4070.', 599.99, 50, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '12GB GDDR6X,Ada Lovelace,7168 CUDA Cores,220W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4070 12GB', 'Efficient Ada Lovelace GPU excellent for 1440p gaming with great ray tracing support.', 549.99, 55, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '12GB GDDR6X,Ada Lovelace,5888 CUDA Cores,200W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4060 Ti 16GB', 'Expanded VRAM variant for modders and creators needing extra memory at 1080p/1440p.', 499.99, 60, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '16GB GDDR6,Ada Lovelace,4352 CUDA Cores,165W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4060 Ti 8GB', 'Fast 1080p and capable 1440p GPU with efficient Ada Lovelace architecture.', 399.99, 70, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '8GB GDDR6,Ada Lovelace,4352 CUDA Cores,160W TDP,PCIe 4.0 x16,DLSS 3'),
('NVIDIA GeForce RTX 4060 8GB', 'Best-value Ada Lovelace GPU for 1080p gamers needing modern features on a budget.', 299.99, 90, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '8GB GDDR6,Ada Lovelace,3072 CUDA Cores,115W TDP,PCIe 4.0 x16,DLSS 3'),
('AMD Radeon RX 7900 XTX 24GB', 'AMD flagship GPU competing at 4K with massive 24GB VRAM for demanding titles.', 949.99, 20, '/images/products/gpu.jpg', 'GPU', 'AMD', '24GB GDDR6,RDNA 3,12288 Shaders,355W TDP,PCIe 4.0 x16,FSR 3'),
('AMD Radeon RX 7900 XT 20GB', 'High-end RDNA 3 GPU with 20GB VRAM, excellent for 4K gaming and content creation.', 749.99, 28, '/images/products/gpu.jpg', 'GPU', 'AMD', '20GB GDDR6,RDNA 3,10752 Shaders,300W TDP,PCIe 4.0 x16,FSR 3'),
('AMD Radeon RX 7800 XT 16GB', 'Mid-range RDNA 3 GPU dominating 1440p gaming with generous 16GB VRAM.', 499.99, 45, '/images/products/gpu.jpg', 'GPU', 'AMD', '16GB GDDR6,RDNA 3,3840 Shaders,263W TDP,PCIe 4.0 x16,FSR 3'),
('AMD Radeon RX 7700 XT 12GB', 'Capable 1440p GPU from AMD with 12GB VRAM at a competitive mid-range price.', 449.99, 50, '/images/products/gpu.jpg', 'GPU', 'AMD', '12GB GDDR6,RDNA 3,3456 Shaders,245W TDP,PCIe 4.0 x16,FSR 3'),
('AMD Radeon RX 7600 8GB', 'Budget-friendly RDNA 3 GPU delivering smooth 1080p gaming performance.', 269.99, 80, '/images/products/gpu.jpg', 'GPU', 'AMD', '8GB GDDR6,RDNA 3,2048 Shaders,165W TDP,PCIe 4.0 x16,FSR 3'),
('ASUS ROG Strix RTX 4090 OC 24GB', 'Factory-overclocked RTX 4090 with premium triple-fan cooler and ROG aesthetics.', 1799.99, 10, '/images/products/gpu.jpg', 'GPU', 'ASUS', '24GB GDDR6X,OC Edition,2640MHz Boost,450W TDP,Triple Fan,ARGB'),
('MSI Gaming X Trio RTX 4080 Super', 'Premium MSI triple-fan RTX 4080 Super with high-end cooling and factory overclock.', 1049.99, 18, '/images/products/gpu.jpg', 'GPU', 'MSI', '16GB GDDR6X,OC Edition,2625MHz Boost,320W TDP,Triple Fan,RGB'),
('Gigabyte AORUS RTX 4070 Ti Super Master', 'AORUS flagship 4070 Ti Super with advanced WindForce triple-fan cooling system.', 849.99, 22, '/images/products/gpu.jpg', 'GPU', 'Gigabyte', '16GB GDDR6X,OC Edition,2670MHz Boost,285W TDP,Triple Fan,ARGB'),
('Sapphire NITRO+ RX 7900 XTX', 'Premium Sapphire RX 7900 XTX with exceptional cooling and overclocking headroom.', 999.99, 15, '/images/products/gpu.jpg', 'GPU', 'Sapphire', '24GB GDDR6,OC Edition,2615MHz Boost,355W TDP,Triple Fan,ARGB'),
('PowerColor Red Devil RX 7800 XT', 'Highly-regarded custom RX 7800 XT with excellent thermal performance and acoustics.', 529.99, 35, '/images/products/gpu.jpg', 'GPU', 'PowerColor', '16GB GDDR6,OC Edition,2565MHz Boost,263W TDP,Triple Fan,RGB'),
('NVIDIA GeForce RTX 3060 12GB', 'Previous-gen GPU still capable of smooth 1080p gaming at reduced prices.', 279.99, 65, '/images/products/gpu.jpg', 'GPU', 'NVIDIA', '12GB GDDR6,Ampere,3584 CUDA Cores,170W TDP,PCIe 4.0 x16,DLSS 2'),
('AMD Radeon RX 6700 XT 12GB', 'Previous RDNA 2 mid-range GPU with 12GB VRAM, great 1080p and decent 1440p.', 299.99, 55, '/images/products/gpu.jpg', 'GPU', 'AMD', '12GB GDDR6,RDNA 2,2560 Shaders,230W TDP,PCIe 4.0 x16,FSR 2'),
('ASUS Dual RTX 4060 OC 8GB', 'Compact dual-fan RTX 4060 suitable for smaller cases needing modern GPU features.', 319.99, 75, '/images/products/gpu.jpg', 'GPU', 'ASUS', '8GB GDDR6,OC Edition,2490MHz Boost,115W TDP,Dual Fan,No RGB'),
('MSI Ventus 3X RTX 4070 12GB', 'Clean triple-fan RTX 4070 without RGB for builders prioritizing performance.', 569.99, 45, '/images/products/gpu.jpg', 'GPU', 'MSI', '12GB GDDR6X,2490MHz Boost,200W TDP,Triple Fan,No RGB'),
('XFX Speedster MERC310 RX 7900 XT', 'Massive triple-fan RX 7900 XT cooler delivering whisper-quiet operation.', 779.99, 20, '/images/products/gpu.jpg', 'GPU', 'XFX', '20GB GDDR6,OC Edition,2535MHz Boost,300W TDP,Triple Fan,RGB'),
('Gigabyte RTX 4060 WindForce OC', 'Affordable triple-fan RTX 4060 with WindForce cooling for reliable 1080p gaming.', 309.99, 80, '/images/products/gpu.jpg', 'GPU', 'Gigabyte', '8GB GDDR6,OC Edition,2475MHz Boost,115W TDP,Triple Fan,No RGB');

-- Storage (25 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Samsung 990 Pro 2TB NVMe', 'Flagship Samsung NVMe SSD with PCIe 4.0 and exceptional sequential speeds.', 179.99, 80, '/images/products/storage.jpg', 'Storage', 'Samsung', '2TB,PCIe 4.0 NVMe,7450MB/s Read,6900MB/s Write,M.2 2280,TLC NAND'),
('Samsung 990 Pro 1TB NVMe', 'High-performance PCIe 4.0 SSD with Samsung MLC NAND for reliable performance.', 99.99, 120, '/images/products/storage.jpg', 'Storage', 'Samsung', '1TB,PCIe 4.0 NVMe,7450MB/s Read,6900MB/s Write,M.2 2280,TLC NAND'),
('Samsung 980 Pro 2TB NVMe', 'Previous flagship PCIe 4.0 NVMe drive with proven Samsung reliability.', 149.99, 95, '/images/products/storage.jpg', 'Storage', 'Samsung', '2TB,PCIe 4.0 NVMe,7000MB/s Read,5100MB/s Write,M.2 2280,TLC NAND'),
('WD Black SN850X 2TB NVMe', 'PlayStation 5 recommended PCIe 4.0 SSD with heatsink option and gaming optimizations.', 169.99, 85, '/images/products/storage.jpg', 'Storage', 'Western Digital', '2TB,PCIe 4.0 NVMe,7300MB/s Read,6600MB/s Write,M.2 2280,TLC NAND'),
('WD Black SN850X 1TB NVMe', 'Top-tier WD gaming SSD with PCIe 4.0 and WD_BLACK dashboard software.', 99.99, 110, '/images/products/storage.jpg', 'Storage', 'Western Digital', '1TB,PCIe 4.0 NVMe,7300MB/s Read,6300MB/s Write,M.2 2280,TLC NAND'),
('Seagate FireCuda 530 2TB NVMe', 'Premium PCIe 4.0 SSD with optional heatsink, PS5 compatible.', 159.99, 75, '/images/products/storage.jpg', 'Storage', 'Seagate', '2TB,PCIe 4.0 NVMe,7300MB/s Read,6900MB/s Write,M.2 2280,TLC NAND'),
('Crucial P3 Plus 2TB NVMe', 'Budget-friendly PCIe 4.0 NVMe SSD delivering solid performance at great value.', 89.99, 150, '/images/products/storage.jpg', 'Storage', 'Crucial', '2TB,PCIe 4.0 NVMe,5000MB/s Read,4200MB/s Write,M.2 2280,QLC NAND'),
('Samsung 870 EVO 2TB SATA', 'Best-selling SATA SSD with reliable Samsung V-NAND and excellent endurance.', 129.99, 100, '/images/products/storage.jpg', 'Storage', 'Samsung', '2TB,SATA III,560MB/s Read,530MB/s Write,2.5-inch,MLC V-NAND'),
('Samsung 870 EVO 1TB SATA', 'Proven SATA SSD workhorse for consistent OS and application storage performance.', 74.99, 140, '/images/products/storage.jpg', 'Storage', 'Samsung', '1TB,SATA III,560MB/s Read,530MB/s Write,2.5-inch,MLC V-NAND'),
('WD Blue 4TB HDD', 'High-capacity traditional hard drive for mass storage and media libraries.', 89.99, 90, '/images/products/storage.jpg', 'Storage', 'Western Digital', '4TB,SATA III,5400RPM,256MB Cache,3.5-inch,CMR'),
('Seagate Barracuda 8TB HDD', 'Large-capacity HDD for NAS-style desktop storage at affordable per-GB cost.', 149.99, 60, '/images/products/storage.jpg', 'Storage', 'Seagate', '8TB,SATA III,7200RPM,256MB Cache,3.5-inch,CMR'),
('WD Red Pro 8TB NAS HDD', 'NAS-optimized hard drive designed for 24/7 operation in home servers.', 229.99, 40, '/images/products/storage.jpg', 'Storage', 'Western Digital', '8TB,SATA III,7200RPM,256MB Cache,3.5-inch,CMR,NAS Optimized'),
('Crucial MX500 2TB SATA', 'Reliable mainstream SATA SSD with Micron NAND and consistent performance.', 109.99, 115, '/images/products/storage.jpg', 'Storage', 'Crucial', '2TB,SATA III,560MB/s Read,510MB/s Write,2.5-inch,TLC NAND'),
('Kingston NV2 2TB NVMe', 'Budget NVMe SSD from Kingston offering PCIe 4.0 speeds at an accessible price.', 79.99, 130, '/images/products/storage.jpg', 'Storage', 'Kingston', '2TB,PCIe 4.0 NVMe,3500MB/s Read,2800MB/s Write,M.2 2280,QLC NAND'),
('Sabrent Rocket 4 Plus 2TB NVMe', 'High-end PCIe 4.0 SSD with excellent peak performance for demanding workloads.', 149.99, 70, '/images/products/storage.jpg', 'Storage', 'Sabrent', '2TB,PCIe 4.0 NVMe,7100MB/s Read,6600MB/s Write,M.2 2280,TLC NAND'),
('WD Black SN770 1TB NVMe', 'Value-oriented PCIe 4.0 NVMe suitable for budget gaming builds.', 69.99, 160, '/images/products/storage.jpg', 'Storage', 'Western Digital', '1TB,PCIe 4.0 NVMe,5150MB/s Read,4900MB/s Write,M.2 2280,TLC NAND'),
('Seagate Barracuda 2TB HDD', 'Affordable traditional hard drive for secondary storage alongside an SSD.', 54.99, 120, '/images/products/storage.jpg', 'Storage', 'Seagate', '2TB,SATA III,7200RPM,256MB Cache,3.5-inch,CMR'),
('Samsung 990 Evo 1TB NVMe', 'New EVO lineup supporting PCIe 4.0/5.0 hybrid for future-proofing.', 89.99, 105, '/images/products/storage.jpg', 'Storage', 'Samsung', '1TB,PCIe 5.0x2/4.0x4 NVMe,5000MB/s Read,4200MB/s Write,M.2 2280,TLC'),
('Corsair MP600 Pro XT 2TB NVMe', 'Corsair PCIe 4.0 flagship SSD with integrated heatsink for sustained performance.', 169.99, 65, '/images/products/storage.jpg', 'Storage', 'Corsair', '2TB,PCIe 4.0 NVMe,7100MB/s Read,6800MB/s Write,M.2 2280,TLC NAND'),
('Crucial P5 Plus 1TB NVMe', 'Mid-range PCIe 4.0 NVMe SSD delivering reliable performance with Micron NAND.', 79.99, 125, '/images/products/storage.jpg', 'Storage', 'Crucial', '1TB,PCIe 4.0 NVMe,6600MB/s Read,5000MB/s Write,M.2 2280,TLC NAND'),
('WD Blue SA510 1TB SATA', 'Dependable everyday SATA SSD for laptops and desktops needing reliable storage.', 64.99, 145, '/images/products/storage.jpg', 'Storage', 'Western Digital', '1TB,SATA III,560MB/s Read,510MB/s Write,2.5-inch,TLC NAND'),
('Seagate IronWolf 12TB NAS HDD', 'Professional NAS drive with AgileArray technology for multi-bay server environments.', 279.99, 30, '/images/products/storage.jpg', 'Storage', 'Seagate', '12TB,SATA III,7200RPM,256MB Cache,3.5-inch,CMR,NAS Optimized'),
('Kingston KC3000 2TB NVMe', 'Enterprise-grade PCIe 4.0 SSD with high endurance for professional workflows.', 159.99, 55, '/images/products/storage.jpg', 'Storage', 'Kingston', '2TB,PCIe 4.0 NVMe,7000MB/s Read,7000MB/s Write,M.2 2280,TLC NAND'),
('Crucial BX500 1TB SATA', 'Entry-level SATA SSD offering significant HDD upgrade performance at budget price.', 54.99, 170, '/images/products/storage.jpg', 'Storage', 'Crucial', '1TB,SATA III,540MB/s Read,500MB/s Write,2.5-inch,TLC NAND'),
('Sabrent Rocket 5 2TB NVMe', 'Next-generation PCIe 5.0 NVMe SSD delivering blazing-fast speeds.', 279.99, 35, '/images/products/storage.jpg', 'Storage', 'Sabrent', '2TB,PCIe 5.0 NVMe,12000MB/s Read,11000MB/s Write,M.2 2280,TLC NAND');

-- PSU (20 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Seasonic PRIME TX-1000', 'Flagship titanium-rated PSU with 10-year warranty and impeccable voltage regulation.', 269.99, 25, '/images/products/psu.jpg', 'PSU', 'Seasonic', '1000W,80+ Titanium,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('Seasonic Focus GX-850', 'Gold-rated modular PSU with whisper-quiet operation and excellent build quality.', 159.99, 60, '/images/products/psu.jpg', 'PSU', 'Seasonic', '850W,80+ Gold,Fully Modular,120mm Fan,10-Year Warranty,ATX'),
('Seasonic Focus GX-750', 'Reliable 750W gold-rated PSU suitable for mid-range gaming builds up to RTX 4070.', 139.99, 75, '/images/products/psu.jpg', 'PSU', 'Seasonic', '750W,80+ Gold,Fully Modular,120mm Fan,10-Year Warranty,ATX'),
('Corsair RM1000x Shift', 'Innovative side-connector design PSU for easier cable management in compatible cases.', 219.99, 30, '/images/products/psu.jpg', 'PSU', 'Corsair', '1000W,80+ Gold,Fully Modular,135mm Fan,10-Year Warranty,ATX,Side Connector'),
('Corsair RM850x', 'Premium 850W gold-rated PSU with ultra-low noise operation and reliable performance.', 159.99, 55, '/images/products/psu.jpg', 'PSU', 'Corsair', '850W,80+ Gold,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('Corsair RM750x', 'Proven 750W gold modular PSU with tight voltage regulation for gaming systems.', 129.99, 80, '/images/products/psu.jpg', 'PSU', 'Corsair', '750W,80+ Gold,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('EVGA SuperNOVA 1000 G6', 'High-wattage gold PSU designed for RTX 4090 and multi-GPU configurations.', 189.99, 35, '/images/products/psu.jpg', 'PSU', 'EVGA', '1000W,80+ Gold,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('be quiet! Dark Power Pro 13 1000W', 'Premium German-engineered PSU with titanium efficiency and exceptional build quality.', 329.99, 15, '/images/products/psu.jpg', 'PSU', 'be quiet!', '1000W,80+ Titanium,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('be quiet! Straight Power 12 850W', 'Quiet-optimized platinum PSU from be quiet! with premium components.', 169.99, 45, '/images/products/psu.jpg', 'PSU', 'be quiet!', '850W,80+ Platinum,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('Fractal Design Ion+ 2 Platinum 760W', 'Compact platinum-rated PSU designed for Fractal cases with semi-modular cabling.', 149.99, 40, '/images/products/psu.jpg', 'PSU', 'Fractal Design', '760W,80+ Platinum,Semi-Modular,120mm Fan,10-Year Warranty,ATX'),
('Lian Li SP850 SFX', 'High-quality SFX form factor PSU for ITX and compact builds needing 850W power.', 179.99, 30, '/images/products/psu.jpg', 'PSU', 'Lian Li', '850W,80+ Gold,Fully Modular,92mm Fan,10-Year Warranty,SFX'),
('Corsair SF750 SFX Platinum', 'Industry-leading SFX PSU combining 750W with platinum efficiency in tiny form factor.', 169.99, 35, '/images/products/psu.jpg', 'PSU', 'Corsair', '750W,80+ Platinum,Fully Modular,92mm Fan,7-Year Warranty,SFX'),
('Seasonic PRIME PX-850 Platinum', 'Platinum-efficiency PSU with top-tier component quality for demanding workstations.', 219.99, 28, '/images/products/psu.jpg', 'PSU', 'Seasonic', '850W,80+ Platinum,Fully Modular,135mm Fan,12-Year Warranty,ATX'),
('Corsair HX1200', 'Professional-grade 1200W PSU with Platinum efficiency for the most demanding builds.', 249.99, 20, '/images/products/psu.jpg', 'PSU', 'Corsair', '1200W,80+ Platinum,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('MSI MEG Ai1300P ATX3.0', 'ATX 3.0 compatible PSU with native 16-pin connector for RTX 4000 series GPUs.', 299.99, 18, '/images/products/psu.jpg', 'PSU', 'MSI', '1300W,80+ Platinum,Fully Modular,135mm Fan,10-Year Warranty,ATX 3.0'),
('ASUS ROG Strix 850G', 'Gaming-themed gold PSU with ROG aesthetics and comprehensive protection features.', 179.99, 42, '/images/products/psu.jpg', 'PSU', 'ASUS', '850W,80+ Gold,Fully Modular,135mm Fan,10-Year Warranty,ATX'),
('Seasonic Focus GX-1000', 'Scaled-up Focus series PSU delivering 1000W gold efficiency for high-end GPU builds.', 189.99, 32, '/images/products/psu.jpg', 'PSU', 'Seasonic', '1000W,80+ Gold,Fully Modular,120mm Fan,10-Year Warranty,ATX'),
('Corsair CX650M', 'Budget semi-modular bronze PSU for entry-level and mid-range gaming builds.', 79.99, 100, '/images/products/psu.jpg', 'PSU', 'Corsair', '650W,80+ Bronze,Semi-Modular,120mm Fan,5-Year Warranty,ATX'),
('Thermaltake Toughpower GF3 1050W ATX3.0', 'ATX 3.0 ready PSU with gold rating and native PCIe 5.0 16-pin connector.', 179.99, 38, '/images/products/psu.jpg', 'PSU', 'Thermaltake', '1050W,80+ Gold,Fully Modular,140mm Fan,10-Year Warranty,ATX 3.0'),
('EVGA BR 600W', 'Affordable bronze-rated PSU for budget builds needing reliable stable power delivery.', 59.99, 120, '/images/products/psu.jpg', 'PSU', 'EVGA', '600W,80+ Bronze,Non-Modular,120mm Fan,3-Year Warranty,ATX');

-- Cooling (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Noctua NH-D15', 'Legendary dual-tower air cooler offering top-tier cooling with near-silent operation.', 109.99, 60, '/images/products/cooling.jpg', 'Cooling', 'Noctua', 'Dual Tower,6 Heatpipes,2x NF-A15 Fans,165mm Height,280W TDP,LGA1700/AM5'),
('Noctua NH-D15S', 'Asymmetric dual-tower variant offering GPU clearance while maintaining excellent cooling.', 109.99, 55, '/images/products/cooling.jpg', 'Cooling', 'Noctua', 'Asymmetric Dual Tower,6 Heatpipes,1x NF-A15 Fan,160mm Height,250W TDP,LGA1700/AM5'),
('Noctua NH-U12S Redux', 'Budget-friendly Noctua single tower with reliable performance and premium build quality.', 59.99, 90, '/images/products/cooling.jpg', 'Cooling', 'Noctua', 'Single Tower,5 Heatpipes,1x NF-P12 Fan,158mm Height,180W TDP,LGA1700/AM5'),
('ARCTIC Liquid Freezer II 360', 'High-performance 360mm AIO with integrated pump-head fan and excellent thermal performance.', 129.99, 45, '/images/products/cooling.jpg', 'Cooling', 'ARCTIC', '360mm AIO,3x120mm Fans,300W+ TDP,LGA1700/AM5,5-Year Warranty'),
('ARCTIC Liquid Freezer II 240', 'Value king 240mm AIO delivering exceptional cooling for its price point.', 89.99, 70, '/images/products/cooling.jpg', 'Cooling', 'ARCTIC', '240mm AIO,2x120mm Fans,250W TDP,LGA1700/AM5,5-Year Warranty'),
('Corsair iCUE H150i Elite LCD XT', 'Premium 360mm AIO with LCD display in the pump head for live monitoring.', 219.99, 25, '/images/products/cooling.jpg', 'Cooling', 'Corsair', '360mm AIO,3x120mm RGB Fans,LCD Pump Head,300W+ TDP,LGA1700/AM5'),
('Corsair iCUE H100i RGB Elite', 'Popular 240mm Corsair AIO with PWM fans and full iCUE software integration.', 149.99, 50, '/images/products/cooling.jpg', 'Cooling', 'Corsair', '240mm AIO,2x120mm RGB Fans,250W TDP,LGA1700/AM5,5-Year Warranty'),
('NZXT Kraken Z73 360mm', 'Premium AIO with 2.36-inch LCD display for system monitoring and custom animations.', 279.99, 20, '/images/products/cooling.jpg', 'Cooling', 'NZXT', '360mm AIO,3x120mm RGB Fans,2.36in LCD Display,300W+ TDP,LGA1700/AM5'),
('NZXT Kraken 360 RGB', 'Capable 360mm AIO with infinity mirror pump head and addressable RGB fans.', 199.99, 30, '/images/products/cooling.jpg', 'Cooling', 'NZXT', '360mm AIO,3x120mm RGB Fans,Infinity Mirror Head,300W+ TDP,LGA1700/AM5'),
('be quiet! Dark Rock Pro 5', 'Flagship dual-tower air cooler with silent wings fans and premium copper heatpipes.', 99.99, 55, '/images/products/cooling.jpg', 'Cooling', 'be quiet!', 'Dual Tower,7 Heatpipes,2x Silent Wings Fans,168mm Height,270W TDP,LGA1700/AM5'),
('Thermalright Peerless Assassin 120 SE', 'Outstanding value dual-tower cooler competing with premium solutions at fraction of cost.', 39.99, 120, '/images/products/cooling.jpg', 'Cooling', 'Thermalright', 'Dual Tower,6 Heatpipes,2x TL-C12 Fans,157mm Height,260W TDP,LGA1700/AM5'),
('DeepCool AK620', 'Excellent dual-tower air cooler combining quiet operation with strong thermal performance.', 59.99, 100, '/images/products/cooling.jpg', 'Cooling', 'DeepCool', 'Dual Tower,6 Heatpipes,2x FK120 Fans,160mm Height,260W TDP,LGA1700/AM5'),
('Cooler Master MasterAir MA824 Stealth', 'Ultra-thin dual-tower design fitting tight cases with surprising thermal performance.', 79.99, 65, '/images/products/cooling.jpg', 'Cooling', 'Cooler Master', 'Dual Tower,8 Heatpipes,2x Fans,167mm Height,280W TDP,LGA1700/AM5'),
('EK-AIO Elite 360 D-RGB', 'Premium EK liquid cooler with high-quality pump and EK-Vardar fans for silent cooling.', 199.99, 28, '/images/products/cooling.jpg', 'Cooling', 'EK', '360mm AIO,3x120mm D-RGB Fans,300W+ TDP,LGA1700/AM5,5-Year Warranty'),
('Lian Li Galahad II LCD 360', 'Stunning AIO with 60mm LCD display for custom animations and real-time monitoring.', 259.99, 18, '/images/products/cooling.jpg', 'Cooling', 'Lian Li', '360mm AIO,3x120mm ARGB Fans,60mm LCD Display,300W+ TDP,LGA1700/AM5'),
('Noctua NH-L9i Chromax.Black', 'Ultra-low-profile cooler in all-black design for slim ITX builds with limited clearance.', 54.99, 75, '/images/products/cooling.jpg', 'Cooling', 'Noctua', 'Low Profile,4 Heatpipes,1x NF-A9x14 Fan,37mm Height,65W TDP,LGA1700'),
('ARCTIC Freezer 36', 'Single-tower budget cooler with dual fan support and excellent price-to-performance.', 34.99, 110, '/images/products/cooling.jpg', 'Cooling', 'ARCTIC', 'Single Tower,5 Heatpipes,1x P12 Fan,155mm Height,200W TDP,LGA1700/AM5'),
('Corsair iCUE H115i Elite Capellix', 'High-performance 280mm AIO with RGB LL140 fans and Capellix LED pump head.', 169.99, 35, '/images/products/cooling.jpg', 'Cooling', 'Corsair', '280mm AIO,2x140mm RGB Fans,270W TDP,LGA1700/AM5,5-Year Warranty'),
('MSI MEG CoreLiquid S360', 'Premium MSI AIO with 2.4-inch LCD screen and high-performance 360mm radiator.', 249.99, 22, '/images/products/cooling.jpg', 'Cooling', 'MSI', '360mm AIO,3x120mm ARGB Fans,2.4in LCD Display,300W+ TDP,LGA1700/AM5'),
('Scythe Fuma 3', 'Excellent Japanese-engineered dual-tower cooler with Kaze Flex fans for quiet performance.', 69.99, 80, '/images/products/cooling.jpg', 'Cooling', 'Scythe', 'Dual Tower,6 Heatpipes,2x Kaze Flex Fans,154mm Height,260W TDP,LGA1700/AM5'),
('Thermalright Frozen Notte 360 ARGB', 'Budget-friendly 360mm AIO with ARGB fans offering competitive cooling at low price.', 64.99, 85, '/images/products/cooling.jpg', 'Cooling', 'Thermalright', '360mm AIO,3x120mm ARGB Fans,280W TDP,LGA1700/AM5,5-Year Warranty'),
('be quiet! Silent Loop 2 360mm', 'German-quality 360mm AIO with ultra-quiet Pure Wings fans and excellent reliability.', 189.99, 32, '/images/products/cooling.jpg', 'Cooling', 'be quiet!', '360mm AIO,3x120mm PWM Fans,300W+ TDP,LGA1700/AM5,5-Year Warranty');

-- Case (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('Fractal Design Meshify 2 XL', 'Spacious full-tower with excellent airflow mesh front and superb cable management.', 189.99, 30, '/images/products/case.jpg', 'Case', 'Fractal Design', 'Full Tower,E-ATX,3x140mm Fans,USB-C Front,Mesh Front,460mm GPU Clearance'),
('Fractal Design Meshify 2', 'Award-winning mid-tower with mesh front panel and top-tier airflow for performance builds.', 149.99, 50, '/images/products/case.jpg', 'Case', 'Fractal Design', 'Mid Tower,ATX,3x140mm Fans,USB-C Front,Mesh Front,440mm GPU Clearance'),
('Fractal Design Define 7', 'Sound-dampened mid-tower prioritizing silence, suitable for quiet workstation builds.', 169.99, 40, '/images/products/case.jpg', 'Case', 'Fractal Design', 'Mid Tower,E-ATX,2x140mm Fans,USB-C Front,Modular Interior,505mm GPU Clearance'),
('Lian Li PC-O11 Dynamic EVO XL', 'Dual-chamber flagship case with exceptional aesthetics and custom water cooling support.', 199.99, 25, '/images/products/case.jpg', 'Case', 'Lian Li', 'Full Tower,E-ATX,4x120mm Fans,USB-C Front,Tempered Glass,420mm GPU Clearance'),
('Lian Li PC-O11 Dynamic EVO', 'Iconic dual-chamber case with PCIe riser slot and stunning tempered glass panels.', 169.99, 45, '/images/products/case.jpg', 'Case', 'Lian Li', 'Mid Tower,ATX,3x120mm Fans,USB-C Front,Tempered Glass,420mm GPU Clearance'),
('Lian Li PC-O11 Air Mini', 'Compact O11 variant with mesh front providing better airflow for ITX/mATX builds.', 109.99, 55, '/images/products/case.jpg', 'Case', 'Lian Li', 'Mid Tower,mATX,3x120mm Fans,USB-C Front,Mesh,420mm GPU Clearance'),
('NZXT H9 Flow', 'Premium dual-chamber case with perforated front and top panels for maximum airflow.', 169.99, 38, '/images/products/case.jpg', 'Case', 'NZXT', 'Mid Tower,ATX,4x120mm Fans,USB-C Front,Tempered Glass,400mm GPU Clearance'),
('NZXT H7 Flow', 'Clean aesthetic NZXT case with mesh front and excellent cable routing channels.', 139.99, 48, '/images/products/case.jpg', 'Case', 'NZXT', 'Mid Tower,ATX,3x120mm Fans,USB-C Front,Mesh Front,400mm GPU Clearance'),
('NZXT H510 Flow', 'Compact mid-tower with mesh front panel upgrading the classic H510 for better airflow.', 109.99, 60, '/images/products/case.jpg', 'Case', 'NZXT', 'Mid Tower,ATX,2x120mm Fans,USB-C Front,Mesh Front,381mm GPU Clearance'),
('Corsair 7000D Airflow', 'Full-tower powerhouse with front mesh, top mesh, and three 120mm intake fans.', 279.99, 20, '/images/products/case.jpg', 'Case', 'Corsair', 'Full Tower,E-ATX,3x120mm Fans,USB-C Front,Mesh Front,520mm GPU Clearance'),
('Corsair 4000D Airflow', 'Best-selling mid-tower with excellent airflow at a competitive price, very versatile.', 104.99, 75, '/images/products/case.jpg', 'Case', 'Corsair', 'Mid Tower,ATX,2x120mm Fans,USB-A Front,Mesh Front,360mm GPU Clearance'),
('Corsair 5000D Airflow', 'Premium mid-tower with dual 120mm front fans and exceptional build quality.', 174.99, 35, '/images/products/case.jpg', 'Case', 'Corsair', 'Mid Tower,ATX,2x120mm Fans,USB-C Front,Mesh Front,420mm GPU Clearance'),
('be quiet! Dark Base 901', 'Premium modular full-tower with silence-optimized design and extensive configuration options.', 249.99, 18, '/images/products/case.jpg', 'Case', 'be quiet!', 'Full Tower,E-ATX,3x140mm Fans,USB-C Front,Sound Dampening,600mm GPU Clearance'),
('be quiet! Pure Base 500DX', 'Balanced mid-tower with three ARGB fans included and solid airflow mesh front.', 119.99, 55, '/images/products/case.jpg', 'Case', 'be quiet!', 'Mid Tower,ATX,3x120mm ARGB Fans,USB-C Front,Mesh Front,369mm GPU Clearance'),
('Phanteks Enthoo Pro 2', 'Massive full-tower supporting HPTX boards with extensive water cooling loop support.', 219.99, 22, '/images/products/case.jpg', 'Case', 'Phanteks', 'Full Tower,HPTX,3x140mm Fans,USB-C Front,Modular,600mm GPU Clearance'),
('Fractal Design Torrent', 'Airflow-first case design with massive front fans delivering best-in-class cooling.', 189.99, 28, '/images/products/case.jpg', 'Case', 'Fractal Design', 'Mid Tower,ATX,2x180mm+3x140mm Fans,USB-C Front,Mesh,491mm GPU Clearance'),
('Thermaltake The Tower 500', 'Convertible mid-tower with panoramic glass and flexible motherboard tray orientation.', 199.99, 25, '/images/products/case.jpg', 'Case', 'Thermaltake', 'Mid Tower,ATX,2x200mm Fans,USB-C Front,360 Glass,530mm GPU Clearance'),
('InWin 101C ARGB', 'Budget-friendly mid-tower with tempered glass and three pre-installed ARGB fans.', 89.99, 80, '/images/products/case.jpg', 'Case', 'InWin', 'Mid Tower,ATX,3x120mm ARGB Fans,USB-A Front,Tempered Glass,380mm GPU Clearance'),
('Cooler Master HAF 700 Evo', 'Flagship airflow case with massive front mesh intake and tool-free design.', 299.99, 15, '/images/products/case.jpg', 'Case', 'Cooler Master', 'Full Tower,E-ATX,3x200mm+3x120mm Fans,USB-C Front,Mesh,410mm GPU Clearance'),
('Lian Li Lancool 216', 'Value-oriented mid-tower with two pre-installed 160mm fans and mesh front panel.', 89.99, 70, '/images/products/case.jpg', 'Case', 'Lian Li', 'Mid Tower,ATX,2x160mm Fans,USB-C Front,Mesh Front,400mm GPU Clearance'),
('Fractal Design Node 804', 'Unique cube-style mATX case with separate chambers for GPU and motherboard cooling.', 129.99, 35, '/images/products/case.jpg', 'Case', 'Fractal Design', 'Cube,mATX,2x140mm Fans,USB-3.0 Front,Dual Chamber,315mm GPU Clearance'),
('SSUPD Meshlicious', 'Ultra-compact ITX case with mesh panels on all sides for maximum airflow in small form factor.', 99.99, 50, '/images/products/case.jpg', 'Case', 'SSUPD', 'Mini-ITX,ITX,2x120mm Fans,USB-C Front,Full Mesh,322mm GPU Clearance');

-- Mini PC (22 products)
INSERT INTO Products (labelP, desP, priceP, QtyP, photoPath, category, brand, specs) VALUES
('MINISFORUM UM790 Pro', 'AMD Ryzen 9 7940HS mini PC with exceptional performance in ultra-compact form factor.', 499.99, 40, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 7940HS,32GB DDR5,1TB NVMe,WiFi 6E,USB4,Thunderbolt 4,2x HDMI'),
('MINISFORUM UM780 XTX', 'Powerful mini PC with AMD Ryzen 9 7940HS and RX 7600M XT discrete GPU inside.', 699.99, 25, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 7940HS,RX 7600M XT,32GB DDR5,1TB NVMe,WiFi 6E,2x USB4'),
('MINISFORUM EliteMini HX99G', 'Gaming-focused mini PC with discrete RX 6600M GPU delivering solid 1080p gaming.', 799.99, 18, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 6900HX,RX 6600M,32GB DDR5,512GB NVMe,WiFi 6,2x HDMI,1x DP'),
('MINISFORUM UM690S', 'Compact Ryzen 9 6900HX mini PC offering workstation-class performance in tiny package.', 449.99, 35, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 6900HX,16GB DDR5,512GB NVMe,WiFi 6,USB4,2x HDMI,1x DP'),
('Beelink GTR7 Pro', 'Premium Ryzen 9 7945HX mini PC with 16-core power for content creation on the go.', 849.99, 15, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Ryzen 9 7945HX,32GB DDR5,1TB NVMe,WiFi 6E,2x USB4,2x HDMI,1x DP'),
('Beelink GTR7', 'Versatile Ryzen 7 7735HS mini PC balancing performance and efficiency.', 569.99, 28, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Ryzen 7 7735HS,16GB DDR5,500GB NVMe,WiFi 6E,USB4,2x HDMI,1x DP'),
('Beelink SEi12 Pro', 'Intel Core i7-1260P mini PC with Thunderbolt 4 connectivity for business use.', 399.99, 40, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Core i7-1260P,16GB DDR4,500GB NVMe,WiFi 6,Thunderbolt 4,2x HDMI'),
('Beelink Mini S13', 'Budget-friendly Intel N100 mini PC for everyday tasks and home server use.', 179.99, 70, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Intel N100,8GB DDR4,256GB NVMe,WiFi 5,USB3.0,2x HDMI,1x DP'),
('MINISFORUM Venus UM773 Lite', 'Compact Ryzen 7 7735HS mini PC with PCIe 4.0 SSD support and USB4 connectivity.', 379.99, 45, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 7 7735HS,16GB DDR5,512GB NVMe,WiFi 6E,USB4,2x HDMI'),
('Intel NUC 13 Pro Core i7', 'Intel official mini PC with Thunderbolt 4 and Core i7-1360P for professional use.', 649.99, 20, '/images/products/minipc.jpg', 'Mini PC', 'Intel', 'Core i7-1360P,16GB DDR4,512GB NVMe,WiFi 6E,Thunderbolt 4,2x Thunderbolt'),
('ASUS NUC 14 Pro+', 'Latest ASUS NUC with Intel Core Ultra CPU featuring NPU for AI-accelerated tasks.', 799.99, 15, '/images/products/minipc.jpg', 'Mini PC', 'ASUS', 'Core Ultra 9 185H,32GB LPDDR5,1TB NVMe,WiFi 6E,Thunderbolt 4,USB4'),
('Beelink EQ12', 'Ultra-affordable Intel N100 mini PC ideal for HTPC, NAS, and light computing tasks.', 149.99, 85, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Intel N100,8GB DDR4,256GB NVMe,WiFi 5,USB3.0,2x HDMI'),
('MINISFORUM HM90', 'Compact Ryzen 9 4900H mini PC offering solid performance at budget-friendly pricing.', 329.99, 50, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 4900H,16GB DDR4,512GB NVMe,WiFi 6,USB3.2,2x HDMI,1x DP'),
('Beelink GTi14', 'Intel Core Ultra mini PC with Arc GPU for AI workloads and efficient daily computing.', 499.99, 30, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Core Ultra 7 155H,Intel Arc GPU,32GB DDR5,1TB NVMe,WiFi 6E,Thunderbolt 4'),
('MINISFORUM Neptune HX77G', 'Ryzen 9 plus RX 6600M powerhouse for portable gaming in a 0.69L form factor.', 749.99, 20, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 6900HX,RX 6600M,32GB DDR5,512GB NVMe,WiFi 6,OCuLink'),
('Beelink SEi14', 'Slim mini PC with Intel Core Ultra providing great performance per watt efficiency.', 449.99, 38, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Core Ultra 5 125H,16GB DDR5,500GB NVMe,WiFi 6E,Thunderbolt 4,2x HDMI'),
('MINISFORUM UM350', 'Ryzen 5 3550H entry-level mini PC for budget-conscious office and streaming use.', 229.99, 60, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 5 3550H,16GB DDR4,256GB NVMe,WiFi 5,USB3.2,2x HDMI,1x DP'),
('GMKtec NucBox G3 Plus', 'Gaming-capable mini PC with Ryzen 7 8845HS and integrated Radeon 780M graphics.', 549.99, 32, '/images/products/minipc.jpg', 'Mini PC', 'GMKtec', 'Ryzen 7 8845HS,Radeon 780M,32GB DDR5,1TB NVMe,WiFi 6E,USB4,2x HDMI'),
('MINISFORUM UM880 Pro', 'Latest AMD Ryzen 9 8945HS mini PC with AI acceleration and RDNA 3.5 graphics.', 599.99, 22, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 8945HS,Radeon 780M,32GB DDR5,1TB NVMe,WiFi 6E,USB4,OCuLink'),
('Beelink GT-N', 'Ultra-compact Intel Celeron N5105 mini PC perfect for low-power applications.', 119.99, 90, '/images/products/minipc.jpg', 'Mini PC', 'Beelink', 'Celeron N5105,8GB DDR4,128GB eMMC,WiFi 5,USB3.0,2x HDMI'),
('MINISFORUM UM790 XTX', 'Ryzen 9 7940HS with OCuLink port enabling external GPU connection for gaming power.', 549.99, 28, '/images/products/minipc.jpg', 'Mini PC', 'MINISFORUM', 'Ryzen 9 7940HS,32GB DDR5,1TB NVMe,WiFi 6E,OCuLink,USB4,2x HDMI'),
('AceMagic S1', 'Compact Intel 12th Gen mini PC for entry-level professional and multimedia tasks.', 269.99, 55, '/images/products/minipc.jpg', 'Mini PC', 'AceMagic', 'Core i5-1235U,16GB DDR4,512GB NVMe,WiFi 6,USB3.2,2x HDMI,1x DP');
