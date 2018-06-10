PP64.spaces = (function() {
  return class Spaces {
    static drawUnknown(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "orange";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    static drawOther(ctx, x, y) {
      PP64.spaces._drawOther(ctx, x, y, 8);
    }

    static drawOther3(ctx, x, y) {
      PP64.spaces._drawOther(ctx, x, y, 12);
    }

    static _drawOther(ctx, x, y, radius) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.lineWidth = radius / 6;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();
      ctx.lineWidth = radius / 4;
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.strokeStyle = "black";
      ctx.setLineDash([radius / 2, 3]);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    static drawBlue(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#0039ff";
      ctx.strokeStyle = "#001281";
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    static drawBlue3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceBlue3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawRed(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#ff3131";
      ctx.strokeStyle = "#611515";
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    static drawRed3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceRed3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawMiniGame(ctx, x, y) {
      // Same as blue
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#0039ff";
      ctx.strokeStyle = "#001281";
      ctx.stroke();
      ctx.fill();

      // Add star on top.
      ctx.fillStyle = "#A4FFFF";
      PP64.spaces._drawStar(ctx, x, y, 8, 5, 0.45);
      ctx.restore();
    }

    static drawMiniGameDuel3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceMiniGameDuel3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawHappening(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#099f0a";
      ctx.strokeStyle = "#2e681e";
      ctx.stroke();
      ctx.fill();

      // Add ? on top
      ctx.fillStyle = "white";
      ctx.font = 'bold 19px monospace';
      ctx.fillText("?", x - 6, y + 6);
      ctx.restore();
    }

    static drawHappening3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceHappening3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawHappeningDuel3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceHappeningDuel3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawStar(ctx, x, y) {
      PP64.spaces._drawStarSpace(ctx, x, y, 8);
    }

    static drawStar3(ctx, x, y) {
      PP64.spaces._drawStarSpace(ctx, x, y, 12);
    }

    static _drawStarSpace(ctx, x, y, radius) {
      ctx.save();
      // Transparent base circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.lineWidth = radius / 8;
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.stroke();
      ctx.fill();

      // Add yellow star on top
      ctx.fillStyle = "yellow";
      PP64.spaces._drawStar(ctx, x, y, radius + 1, 5, 0.45);
      ctx.restore();
    }

    static drawChance(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#0039ff";
      ctx.strokeStyle = "#001281";
      ctx.stroke();
      ctx.fill();

      // Add '!'
      ctx.fillStyle = "#ff3131";
      ctx.font = "bold 19px monospace";
      ctx.fillText("!", x - 6, y + 6);
      ctx.restore();
    }

    static drawChance2(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#099f0a";
      ctx.strokeStyle = "#2e681e";
      ctx.stroke();
      ctx.fill();

      // Add '!'
      ctx.fillStyle = "white";
      ctx.font = "bold 19px monospace";
      ctx.fillText("!", x - 6, y + 6);
      ctx.restore();
    }

    static drawChance3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceChance3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawStart(ctx, x, y) {
      PP64.spaces._drawStart(ctx, x, y, 8, "black");
    }

    static drawStart3(ctx, x, y) {
      PP64.spaces._drawStart(ctx, x, y, 12, "black");
    }

    static drawStartDuelRed(ctx, x, y) {
      PP64.spaces._drawStart(ctx, x, y, 12, "red");
    }

    static drawStartDuelBlue(ctx, x, y) {
      PP64.spaces._drawStart(ctx, x, y, 12, "blue");
    }

    static _drawStart(ctx, x, y, radius, color) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 1;
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.stroke();
      ctx.fill();

      // Write the word "START"
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.strokeText("START", x, y + 12);
      ctx.fillText("START", x, y + 12);
      ctx.restore();
    }

    static drawShroom(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(x, y, 8, 6, 0, 0, 2 * Math.PI);
      }
      else {
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
      }
      ctx.lineWidth = 2;
      ctx.fillStyle = "#0039ff";
      ctx.strokeStyle = "#001281";
      ctx.stroke();
      ctx.fill();

      // Add dots
      ctx.beginPath();
      ctx.fillStyle = "#D3FDFC";
      ctx.arc(x, y + 5, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 5, y, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 5, y, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - 2, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    static drawBowser(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceBowser"), x - 9, y - 9);
      ctx.restore();
    }

    static drawBowser3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceBowser3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawItem2(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceItem2"), x - 9, y - 9);
      ctx.restore();
    }

    static drawItem3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceItem3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawBattle2(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#099f0a";
      ctx.strokeStyle = "#2e681e";
      ctx.stroke();
      ctx.fill();

      // Zip zap
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.translate(x - 10, y - 10);
      ctx.moveTo(14, 3); // Top point
      ctx.lineTo(4, 11); // Left point
      ctx.lineTo(9, 11); // Go inward
      ctx.lineTo(7, 18); // Bottom point
      ctx.lineTo(16, 9); // Right point
      ctx.lineTo(12, 9); // Go inward
      ctx.lineTo(14, 3); // Back to top point
      ctx.fill();
      ctx.restore();
    }

    static drawBattle3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceBattle3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawBank2(ctx, x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.fillStyle = "#099f0a";
      ctx.strokeStyle = "#2e681e";
      ctx.stroke();
      ctx.fill();

      // Add fancy drawing of coin bag
      ctx.fillStyle = "#EEF700";
      ctx.translate(x - 10, y - 10);
      ctx.beginPath();
      ctx.arc(10, 12, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 7);
      ctx.lineTo(7, 5);
      ctx.lineTo(8, 4);
      ctx.lineTo(12, 4);
      ctx.lineTo(13, 5);
      ctx.lineTo(12, 7);
      ctx.fill();

      ctx.fillStyle = "#099f0a";
      PP64.spaces._drawStar(ctx, 10, 12, 4, 5, 0.45);
      ctx.restore();
    }

    static drawBank3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceBank3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawArrow(ctx, x, y, game) {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "#F647A0";
      ctx.strokeStyle = "#94305B";
      if (game === 3) {
        ctx.translate(x - 12, y - 12);
        ctx.scale(1.25, 1.25);
      }
      else {
        ctx.translate(x - 10, y - 10);
      }
      ctx.moveTo(10, 1);  // Top point
      ctx.lineTo(1, 10);  // Left point
      ctx.lineTo(5, 10);  // Go inward
      ctx.lineTo(5, 18);  // Bottom left
      ctx.lineTo(15, 18); // Bottom right
      ctx.lineTo(15, 10); // Inner right
      ctx.lineTo(19, 10); // Right point
      ctx.lineTo(10, 1);  // Back to top
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    static drawBlackStar2(ctx, x, y) {
      ctx.save();
      // Transparent base circle
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.stroke();
      ctx.fill();

      // Add black star on top
      ctx.fillStyle = "black";
      PP64.spaces._drawStar(ctx, x, y, 9, 5, 0.45);
      ctx.restore();
    }

    static drawGameGuy3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceGameGuy3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawGameGuyDuel3(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceGameGuyDuel3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawDuelBasic(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceDuelBasic3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawDuelPowerup(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceDuelPowerup3"), x - 14, y - 14);
      ctx.restore();
    }

    static drawDuelReverse(ctx, x, y) {
      ctx.save();
      ctx.drawImage(PP64.images.get("spaceDuelReverse3"), x - 14, y - 14);
      ctx.restore();
    }

    // Draws any star shape, helper method.
    static _drawStar(ctx, x, y, r, numPoints, radiusInsetFraction) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.moveTo(0, 0 - r);
      for (let i = 0; i < numPoints; i++) {
        ctx.rotate(Math.PI / numPoints);
        ctx.lineTo(0, 0 - (r * radiusInsetFraction));
        ctx.rotate(Math.PI / numPoints);
        ctx.lineTo(0, 0 - r);
      }
      ctx.fill();
      ctx.restore();
    }
  };
})();
