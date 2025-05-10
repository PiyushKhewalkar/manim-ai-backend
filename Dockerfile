# FROM python:3.10-slim

# ENV DEBIAN_FRONTEND=noninteractive

# # Install system packages
# RUN apt-get update && \
#     apt-get install -y \
#     build-essential \
#     libglib2.0-dev \
#     libcairo2-dev \
#     pkg-config \
#     ffmpeg \
#     libavdevice-dev \
#     libavfilter-dev \
#     libavformat-dev \
#     libavcodec-dev \
#     libavutil-dev \
#     libswscale-dev \
#     libpango1.0-dev \
#     libharfbuzz-dev \
#     curl \
#     cmake \
#     git \
#     python3-dev \
#     libgl1-mesa-dev \
#     libgles2-mesa-dev && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# # ✅ Install Node.js LTS (via NodeSource)
# RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
#     apt-get install -y nodejs

# # ✅ Install Python packages
# RUN pip install --upgrade pip && \
#     pip install --default-timeout=100 --retries=10 manim

# # ✅ Set working directory
# WORKDIR /app

# # ✅ Copy package files and install Node deps
# COPY package*.json ./
# RUN npm install

# # ✅ Copy rest of your code
# COPY . .

# # ✅ Create necessary folders
# RUN mkdir -p /media/videos /scenes

# # ✅ Expose the port your server runs on
# EXPOSE 3000

# # ✅ Start the Node server
# CMD ["node", "server.js"]
