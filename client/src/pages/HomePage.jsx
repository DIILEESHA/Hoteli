import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Carousel, Button, Card, Avatar } from "antd";
import { Link } from 'react-router-dom';


function HomePage() {
    const contentStyle = {
        color: "#fff",
        justifyContent: "center",
        lineHeight: "160px",

        textAlign: "center",
        margin: "auto",
        borderRadius: "10px",
        marginTop: "25px",
    };
    const { Meta } = Card;
    const navigate = useNavigate(); // Initialize useNavigate

    // Function to handle button click
    const handleFindOutMore = () => {
        navigate('/rooms'); // Navigate to the RoomListPage
    };

    return (
        <div>
            <div className="center">
                <Carousel
                    autoplay
                    style={{ height: "669px", width: "1320px" }}
                >
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.ibb.co/jRNxd4j/80043638.jpg"
                            alt="corosal4"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.ibb.co/k5Jk9zk/Calfornia-Grill-venue-2.jpg"
                            alt="corosal1"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.ibb.co/3f5QXkj/213972443.jpg"
                            alt="corosal2"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.ibb.co/cCTRwJB/About-Galadari-3.jpg"
                            alt="corosal3"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.ibb.co/PwH54w8/About-Galadari-1.jpg"
                            alt="corosal4"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                </Carousel>
            </div>
            <div className="sg_home_page_txt_area">
                <h3>Your exquisite escape, where comfort meets elegance</h3>
                <h1>Luxury at your doorstep</h1>
            </div>
            <div className="sg_home_page_paragraph_area">
                <div className="sg_home_page_paragraph_area_p1">
                    <h>Renowned as the premier city hotel, Sixth Gear Hotel is strategically located in the vibrant heart of the metropolis, offering stunning views of the serene waterfront and the bustling cityscape. Whether you’re seeking a luxurious retreat, a culinary adventure, or a venue to celebrate life’s special occasions, Sixth Gear Hotel is your haven of comfort and relaxation. Experience unmatched elegance and sophistication at Sixth Gear Hotel, where luxury harmonizes with tranquility in the center of the city.
                    </h>
                </div>
                <div className="sg_home_page_paragraph_area_p2">
                    <h>Whether you're visiting for business or leisure, we are dedicated to extending a warm welcome to all our guests with heartfelt hospitality and a commitment to making your stay unforgettable. Our outstanding services and unwavering pursuit of excellence distinguish Sixth Gear Hotel from the rest. Come, settle in, and feel at home — we’ll take care of every detail for you.</h>
                </div>
            </div>
            <div className="sg_home_page_img_section_main">
                <div className="sg_home_page_image_1">
                    {/* image home */}
                </div>
            </div>
            <div className="sg_home_page_room_section_txt">
                <h3>Live in the lap of luxury</h3>
                <h1>A SLICE OF HEAVEN!</h1>
            </div>
            <div className="sg_home_page_room_section">
                <div className="sg_home_page_room_image_section">
                </div>
                <div className="sg_home_page_room_bag">
                    <div className="sg_home_page_room_txt">
                        <h2>BEST LUXURY ROOMS</h2>
                        <h>Experience the pinnacle of comfort in our Best Luxury Rooms, where modern elegance meets unparalleled amenities. Every detail is crafted to ensure your stay is nothing short of extraordinary, offering a serene escape in the heart of the city</h>
                        <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent' }} onClick={handleFindOutMore}>FIND ROOM</Button>
                    </div>
                </div>
            </div>
            <div className="sg_home_page_food_section_main">
                <div className="sg_home_page_food_bg_image_section">
                    <div className="sg_home_page_food_bg_section">
                        <div className="sg_home_page_food_item_section_main">
                            <div className="sg_home_page_food_txt">
                                <h3>Moments of pleasure and exceptional taste
                                </h3>
                                <h2>Tantalising Flavours!
                                </h2>
                                <h>Embark on a culinary journey and discover a world of delectable dishes from Sri Lanka and beyond. Immerse yourself in the exquisite flavours and let your taste buds explode with every bite. Head to our cosy restaurants and indulge in a wide range of freshly prepared dishes or beverages of your choice.</h>
                                <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent', width: 140, marginLeft: 60, marginTop: 30 }}>FIND MORE</Button>
                            </div>
                            <div className="sg_home_page_food_card_section">
                                <div className="sg_home_page_food_card_set">

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="sg_home_page_online_oder_section">
                <div className="sg_home_page_online_oder_image">
                </div>
                <div className="sg_home_page_online_oder_btn_txt" >
                    <div className="sg_home_page_online_oder_txt">
                        <h3>Online food delivery</h3>
                        <h2>Satisfy your cravings</h2>
                        <h>Fancy a delicious dish? Contact us and we will deliver it to your doorstep.</h>
                    </div>
                    <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent', width: 140, marginLeft: 220, marginTop: 20 }}>ODER NOW</Button>
                </div>
            </div>
            <div className="sg_home_page_package_txt">
                <h1>SPECIAL EVENTS</h1>
            </div>
            <div className="sg_home_page_package_section">
                <div className="home_page_our_category_section1">
                    <div className="home_page_category_card1">
                        <Link
                            to="./events"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}
                        >
                            <h3>Weddings</h3>
                        </Link>
                    </div>
                    <div className="home_page_category_card2">
                        <Link to="./events"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                        <h3>Birthdays</h3>
                        </Link>
                    </div>
                    <div className="home_page_category_card3">
                        <Link style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                        <h3>Get Together</h3>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="home_page_category_section2">
                <div className="home_page_category_card4">
                    <Link to="./events"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                    <h3>Farewell</h3>
                    </Link>
                </div>
                <div className="home_page_category_card5">
                    <Link to="./events"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                    <h3>Bride To Be</h3>
                    </Link>
                </div>
                <div className="home_page_category_card6">
                    <Link to="./events"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                    <h3>Anniversary</h3>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
