import { createElement } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import './index.css';
import Image from 'rax-image';

export default function Home(props) {
  return (
    <View className="home">
      <Image className="logo"></Image>
      <Text className="title">Welcome to Your Rax App</Text>
      <Text className="info">容器优化方案Demo</Text>
    </View>
  );
}
